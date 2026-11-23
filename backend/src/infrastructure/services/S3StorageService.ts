import AWS from 'aws-sdk';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { ENV_CONFIG } from '../config/env.config';
import { MediaAccessError } from '../../domain/errors/MediaAccessError';

/** Who may delete what: a member only their own community/<ownerId>/ folder, an admin any key. */
export type MediaDeleteScope = { ownerId: string } | { anyKey: true };

export class S3StorageService {
    private s3: AWS.S3;
    private bucketName: string;

    constructor() {
        const awsConfig = {
            accessKeyId: ENV_CONFIG.AWS_ACCESS_KEY_ID,
            secretAccessKey: ENV_CONFIG.AWS_SECRET_ACCESS_KEY,
            region: ENV_CONFIG.AWS_REGION,
            signatureVersion: 'v4',
        };

        AWS.config.update(awsConfig);

        this.s3 = new AWS.S3({
            ...awsConfig,
            s3ForcePathStyle: false,
        });

        this.bucketName = ENV_CONFIG.AWS_S3_BUCKET_NAME!;

        if (!this.bucketName) {
            throw new Error('AWS_S3_BUCKET_NAME environment variable is required');
        }

    }


    private sanitizeFilename(originalName: string): string {

        try {
            // First try to decode if it's URL encoded
            let decoded = originalName;
            try {
                decoded = decodeURIComponent(originalName);
            } catch (e) {
                // If decoding fails, use original
                decoded = originalName;
            }

            // Convert from buffer encoding issues (Arabic text)
            let sanitized = decoded;

            // If we have encoding issues, create a safe filename
            if (sanitized.includes('Ø') || sanitized.includes('\\x')) {
                const ext = path.extname(originalName).toLowerCase();
                const timestamp = Date.now();
                const uuid = uuidv4().substring(0, 8);
                sanitized = `media_${timestamp}_${uuid}${ext || '.mp4'}`;
            } else {
                // Normal sanitization for regular filenames
                sanitized = sanitized
                    .normalize('NFD') // Decompose accented characters
                    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
                    .replace(/[^\w\s.-]/g, '') // Remove special characters
                    .replace(/\s+/g, '_') // Replace spaces with underscores
                    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
                    .toLowerCase() // Convert to lowercase
                    .substring(0, 100); // Limit length
            }

            // Ensure we have a valid extension
            if (!path.extname(sanitized)) {
                const originalExt = path.extname(originalName);
                if (originalExt) {
                    sanitized += originalExt.toLowerCase();
                } else {
                    sanitized += '.bin'; // Default extension
                }
            }

            return sanitized;

        } catch (error) {
            console.error('Error sanitizing filename:', error);
            // Fallback to timestamp-based name
            const ext = path.extname(originalName).toLowerCase() || '.bin';
            return `media_${Date.now()}_${uuidv4().substring(0, 8)}${ext}`;
        }
    }

    /**
     * Generate unique filename for S3
     */
    private generateUniqueFilename(originalName: string, userId: string): string {
        const sanitizedName = this.sanitizeFilename(originalName);
        const ext = path.extname(sanitizedName);
        const nameWithoutExt = path.basename(sanitizedName, ext);
        const timestamp = Date.now();
        const uuid = uuidv4().substring(0, 8);

        return `${nameWithoutExt}_${timestamp}_${uuid}${ext}`;
    }

    /**
     * Preserve user folder naming (including spaces/unicode) while blocking path traversal.
     */
    private sanitizeFolderPath(folderPath?: string): string {
        if (!folderPath) {
            return '';
        }

        const normalized = folderPath.replace(/\\/g, '/');
        const safePath = normalized
            .split('/')
            .map(segment => segment.trim())
            .filter(segment => segment && segment !== '.' && segment !== '..')
            .join('/');

        return safePath;
    }

    /**
     * Preserve user filename (including spaces/unicode) and keep stable keys without random suffixes.
     */
    private buildCustomFilename(baseName: string, originalName: string): string {
        const originalExt = path.extname(originalName).toLowerCase() || '.bin';
        const cleanedBase = baseName
            .trim()
            .replace(/[\\/]/g, ' ')
            .replace(/[\x00-\x1f\x7f]/g, '')
            .replace(/\s{2,}/g, ' ')
            .replace(/^\.+|\.+$/g, '')
            .substring(0, 180);

        if (!cleanedBase) {
            return this.sanitizeFilename(originalName);
        }

        if (path.extname(cleanedBase)) {
            return cleanedBase;
        }

        return `${cleanedBase}${originalExt}`;
    }

    /**
     * Validate community media file
     */
    static validateCommunityMediaFile(file: Express.Multer.File): void {
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
        const allowedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/mp4', 'audio/x-m4a'];
        const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes, ...allowedAudioTypes];

        if (!allowedTypes.includes(file.mimetype)) {
            throw new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`);
        }

        const maxImageSize = 10 * 1024 * 1024; // 10MB
        const maxVideoSize = 100 * 1024 * 1024; // 100MB
        const maxAudioSize = 20 * 1024 * 1024; // 20MB
        const maxSize = file.mimetype.startsWith('image/')
            ? maxImageSize
            : file.mimetype.startsWith('audio/')
                ? maxAudioSize
                : maxVideoSize;

        if (file.size > maxSize) {
            const maxSizeLabel = file.mimetype.startsWith('image/')
                ? '10MB'
                : file.mimetype.startsWith('audio/')
                    ? '20MB'
                    : '100MB';
            throw new Error(`File size exceeds ${maxSizeLabel}. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        }
    }

    /**
     * Upload single community media file
     */
    async uploadCommunityMedia(
        userId: string,
        fileData: { buffer: Buffer; filename: string; mimeType: string },
        targetFolder?: string,
        customFileName?: string
    ): Promise<{ url: string; size: number; mimeType: string }> {
        try {

            // Validate inputs
            if (!userId) {
                throw new Error('User ID is required');
            }

            if (!fileData.buffer || fileData.buffer.length === 0) {
                throw new Error('Empty file buffer');
            }

            if (!fileData.filename) {
                throw new Error('Filename is required');
            }

            // Generate safe filename
            const safeFilename = customFileName
                ? this.buildCustomFilename(customFileName, fileData.filename)
                : this.generateUniqueFilename(fileData.filename, userId);

            const safeFolderPath = this.sanitizeFolderPath(targetFolder);

            // For explicit folder uploads (lesson audio), use exact folder path without community/userId prefixes.
            const key = safeFolderPath
                ? `${safeFolderPath}/${safeFilename}`
                : `community/${userId}/${safeFilename}`;

            // Prepare upload parameters
            const uploadParams: AWS.S3.PutObjectRequest = {
                Bucket: this.bucketName,
                Key: key,
                Body: fileData.buffer,
                ContentType: fileData.mimeType,
                // ASCII fallback plus RFC 5987 UTF-8 name, so Japanese file names don't break the header.
                ContentDisposition: `inline; filename="${safeFilename.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
                CacheControl: 'public, max-age=31536000', // 1 year cache
                // ACL: 'public-read', // Make file publicly accessible
                Metadata: {
                    'uploaded-by': userId,
                    'original-filename': this.sanitizeFilename(fileData.filename),
                    'upload-timestamp': Date.now().toString(),
                    'file-size': fileData.buffer.length.toString()
                }
            };

            // Perform S3 upload
            const result = await this.s3.upload(uploadParams).promise();

            return {
                url: result.Location,
                size: fileData.buffer.length,
                mimeType: fileData.mimeType,
            };

        } catch (error: any) {

            // Provide specific error messages based on error codes
            let errorMessage = `Failed to upload to S3: ${error.message}`;

            switch (error.code) {
                case 'SignatureDoesNotMatch':
                    errorMessage = 'AWS credentials are invalid or expired. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.';
                    break;
                case 'NoSuchBucket':
                    errorMessage = `S3 bucket "${this.bucketName}" does not exist or is not accessible.`;
                    break;
                case 'AccessDenied':
                    errorMessage = 'Access denied. Please check your AWS IAM permissions for S3 operations.';
                    break;
                case 'InvalidAccessKeyId':
                    errorMessage = 'Invalid AWS Access Key ID. Please verify your credentials.';
                    break;
                case 'TokenRefreshRequired':
                    errorMessage = 'AWS security token has expired. Please refresh your credentials.';
                    break;
                default:
                    break;
            }

            throw new Error(errorMessage);
        }
    }

    /**
     * Upload multiple community media files
     */
    async uploadMultipleCommunityMedia(
        userId: string,
        filesData: Array<{ buffer: Buffer; filename: string; mimeType: string }>,
        targetFolder?: string,
        customFileName?: string
    ): Promise<Array<{ url: string; size: number; mimeType: string }>> {
        try {

            // Validate input
            if (!filesData || filesData.length === 0) {
                throw new Error('No files provided for upload');
            }

            if (filesData.length > 10) {
                throw new Error('Maximum 10 files allowed per upload');
            }

            const uploadPromises = filesData.map((fileData, index) => {
                return this.uploadCommunityMedia(userId, fileData, targetFolder, customFileName);
            });

            const results = await Promise.all(uploadPromises);

            return results;

        } catch (error: any) {
            console.error('❌ Multiple upload error:', error.message);
            console.error('Error details:', error);
            throw new Error(`Failed to upload multiple files: ${error.message}`);
        }
    }

    /**
     * Return the object key for a URL that points at our bucket
     * (virtual-hosted or path-style), or null for anything else.
     */
    static keyFromBucketUrl(mediaUrl: unknown): string | null {
        if (typeof mediaUrl !== 'string') {
            return null;
        }

        let url: URL;
        try {
            url = new URL(mediaUrl);
        } catch {
            return null;
        }

        if (url.protocol !== 'https:') {
            return null;
        }

        const host = url.hostname.toLowerCase();
        const bucket = (ENV_CONFIG.AWS_S3_BUCKET_NAME || '').toLowerCase();
        if (!bucket) {
            return null;
        }
        const region = (ENV_CONFIG.AWS_REGION || '').toLowerCase();
        const bucketHosts = [`${bucket}.s3.amazonaws.com`, `${bucket}.s3.${region}.amazonaws.com`, `${bucket}.s3-${region}.amazonaws.com`];
        const pathStyleHosts = ['s3.amazonaws.com', `s3.${region}.amazonaws.com`, `s3-${region}.amazonaws.com`];

        let encodedKey = url.pathname.substring(1);
        if (bucketHosts.includes(host)) {
            // key is the whole path
        } else if (pathStyleHosts.includes(host) && encodedKey.startsWith(`${bucket}/`)) {
            encodedKey = encodedKey.substring(bucket.length + 1);
        } else {
            return null;
        }

        let key: string;
        try {
            key = decodeURIComponent(encodedKey);
        } catch {
            return null;
        }

        return key || null;
    }

    /**
     * True when the key is inside the member's own upload folder: community/<userId>/...
     */
    static isUserMediaKey(key: string, userId: string): boolean {
        if (!userId || /[\\/]/.test(userId)) {
            return false;
        }
        const prefix = `community/${userId}/`;
        if (!key.startsWith(prefix) || key.length === prefix.length) {
            return false;
        }
        return !key.includes('\\') && !key.split('/').some(segment => segment === '.' || segment === '..');
    }

    /**
     * Members may attach only their own uploads to a post or feedback. Without this, a member could
     * put any bucket URL (a paid lesson video) on a post: the API would hand out a presigned link
     * to everyone who reads the post, and deleting the post would delete that object.
     * Admins are not limited. URLs listed in `alreadyAttached` (an unchanged post) are allowed.
     */
    static assertMemberMediaUrls(
        mediaUrls: unknown,
        user: { userId: string; userRole?: string },
        alreadyAttached: string[] = []
    ): void {
        if (mediaUrls === undefined || mediaUrls === null) {
            return;
        }
        if (!Array.isArray(mediaUrls) || !mediaUrls.every(url => typeof url === 'string')) {
            throw new MediaAccessError('mediaUrls must be an array of strings', 400);
        }
        if (user.userRole === 'ADMIN') {
            return;
        }
        const kept = new Set(alreadyAttached);
        for (const url of mediaUrls) {
            if (kept.has(url)) {
                continue;
            }
            const key = S3StorageService.keyFromBucketUrl(url);
            if (!key || !S3StorageService.isUserMediaKey(key, user.userId)) {
                throw new MediaAccessError('You can only attach media you uploaded');
            }
        }
    }

    /**
     * True when the URL may be deleted under the given scope.
     * `{ ownerId }` allows only community/<ownerId>/...; `{ anyKey: true }` allows any key in our bucket (admins).
     */
    canDeleteMediaUrl(mediaUrl: unknown, scope: MediaDeleteScope): boolean {
        const key = S3StorageService.keyFromBucketUrl(mediaUrl);
        if (!key) {
            return false;
        }
        return 'anyKey' in scope ? scope.anyKey === true : S3StorageService.isUserMediaKey(key, scope.ownerId);
    }

    /**
     * Delete community media file. Callers must check permissions first;
     * user-facing code goes through deleteMultipleCommunityMedia with a scope.
     */
    async deleteCommunityMedia(mediaUrl: string): Promise<void> {
        try {
            const key = S3StorageService.keyFromBucketUrl(mediaUrl);
            if (!key) {
                throw new Error('Not a media URL in this bucket');
            }

            const deleteParams: AWS.S3.DeleteObjectRequest = {
                Bucket: this.bucketName,
                Key: key
            };

            await this.s3.deleteObject(deleteParams).promise();

        } catch (error: any) {
            throw new Error(`Failed to delete media: ${error.message}`);
        }
    }

    /**
     * Delete multiple community media files. URLs outside the scope are skipped, never deleted.
     */
    async deleteMultipleCommunityMedia(mediaUrls: string[], scope: MediaDeleteScope): Promise<void> {
        try {

            if (!mediaUrls || mediaUrls.length === 0) {
                return;
            }

            const allowed = mediaUrls.filter(url => this.canDeleteMediaUrl(url, scope));
            if (allowed.length < mediaUrls.length) {
                console.warn(`Skipped ${mediaUrls.length - allowed.length} media URL(s) outside the allowed folder`);
            }

            // Delete files concurrently
            const deletePromises = allowed.map(url => this.deleteCommunityMedia(url));
            await Promise.all(deletePromises);


        } catch (error: any) {
            console.error('❌ Multiple delete error:', error);
            // Don't throw error for delete operations - just log it
            console.warn('Some files may not have been deleted');
        }
    }

    /**
     * Test S3 connection and permissions
     */
    async testConnection(): Promise<boolean> {
        try {

            // Test 1: List buckets (credential test)
            const buckets = await this.s3.listBuckets().promise();

            // Test 2: Check target bucket
            await this.s3.headBucket({ Bucket: this.bucketName }).promise();

            // Test 3: Test upload/delete permissions
            const testKey = `test-connection-${Date.now()}.txt`;
            await this.s3.upload({
                Bucket: this.bucketName,
                Key: testKey,
                Body: 'Connection test',
                ContentType: 'text/plain'
            }).promise();

            await this.s3.deleteObject({
                Bucket: this.bucketName,
                Key: testKey
            }).promise();

            return true;

        } catch (error: any) {
            console.error('❌ S3 connection test failed:', error.message);
            return false;
        }
    }
}