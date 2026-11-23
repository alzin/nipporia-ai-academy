import { CourseRepository } from "../../../../infrastructure/database/repositories/CourseRepository";
import { S3StorageService } from "../../../../infrastructure/services/S3StorageService";

// Course cover images live in the private media bucket under this folder.
// Only objects under it are ever deleted by this use case.
export const COURSE_COVER_FOLDER = 'course-covers';
export const COURSE_COVER_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const COURSE_COVER_MAX_BYTES = 5 * 1024 * 1024; // 5MB

export class CourseCoverError extends Error {
    constructor(message: string, public readonly status: number) {
        super(message);
    }
}

export class CourseCoverUseCase {
    constructor(
        private readonly courseRepository: CourseRepository,
        private readonly storage: S3StorageService
    ) { }

    /** Uploads a new cover (replacing any old one) and returns the updated course. */
    async upload(courseId: string, userId: string, file: { buffer: Buffer; filename: string; mimeType: string }) {
        if (!COURSE_COVER_MIME_TYPES.includes(file.mimeType)) {
            throw new CourseCoverError('JPG・PNG・WebP の画像を選んでください。', 400);
        }
        if (!file.buffer?.length || file.buffer.length > COURSE_COVER_MAX_BYTES) {
            throw new CourseCoverError('画像は5MBまでにしてください。', 400);
        }

        const course = await this.courseRepository.findById(courseId);
        if (!course) throw new CourseCoverError('Course not found', 404);

        // Same upload path as other media; a unique file name per upload, so a
        // replaced cover never shows the old image from a cache.
        const uploaded = await this.storage.uploadCommunityMedia(userId, file, `${COURSE_COVER_FOLDER}/${courseId}`);

        const previous = course.coverImageUrl;
        course.coverImageUrl = uploaded.url;
        course.updatedAt = new Date();
        const saved = await this.courseRepository.update(course);

        await this.deleteOld(previous);
        return saved;
    }

    /** Removes the cover; the course falls back to its icon. */
    async remove(courseId: string) {
        const course = await this.courseRepository.findById(courseId);
        if (!course) throw new CourseCoverError('Course not found', 404);

        const previous = course.coverImageUrl;
        course.coverImageUrl = null;
        course.updatedAt = new Date();
        const saved = await this.courseRepository.update(course);

        await this.deleteOld(previous);
        return saved;
    }

    private async deleteOld(url?: string | null): Promise<void> {
        if (!url) return;
        try {
            const key = decodeURIComponent(new URL(url).pathname.replace(/^\/+/, ''));
            if (!key.startsWith(`${COURSE_COVER_FOLDER}/`)) return;
            await this.storage.deleteCommunityMedia(url);
        } catch (error) {
            console.warn('[course-cover] could not delete the old cover:', (error as Error).message);
        }
    }
}
