import { S3StorageService } from '../../../infrastructure/services/S3StorageService';
import { MediaAccessError } from '../../../domain/errors/MediaAccessError';

export interface UploadMediaRequest {
    userId: string;
    userRole: string;
    // Admin only: choose the folder and file name. Members always upload to community/<userId>/.
    targetFolder?: string;
    customFileName?: string;
    files: Array<{
        buffer: Buffer;
        filename: string;
        mimeType: string;
    }>;
}

export interface UploadMediaResponse {
    files: Array<{
        url: string;
        size: number;
        mimeType: string;
    }>;
}

export class UploadMediaUseCase {
    constructor(private storageService: S3StorageService) { }

    async execute(request: UploadMediaRequest): Promise<UploadMediaResponse> {
        const { userId, userRole, files } = request;
        const targetFolder = request.targetFolder?.trim() || undefined;
        const customFileName = request.customFileName?.trim() || undefined;

        if ((targetFolder || customFileName) && userRole !== 'ADMIN') {
            throw new MediaAccessError('Only admins can choose the upload folder or file name');
        }

        // Validate files
        for (const file of files) {
            S3StorageService.validateCommunityMediaFile({
                buffer: file.buffer,
                originalname: file.filename,
                mimetype: file.mimeType,
            } as Express.Multer.File);
        }

        const uploadedFiles = await this.storageService.uploadMultipleCommunityMedia(
            userId,
            files,
            targetFolder,
            customFileName
        );

        return {
            files: uploadedFiles.map(file => ({
                url: file.url,
                size: file.size,
                mimeType: file.mimeType,
            })),
        };
    }
}
