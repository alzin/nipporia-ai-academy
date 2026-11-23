import { MediaDeleteScope, S3StorageService } from "../../../infrastructure/services/S3StorageService";
import { MediaAccessError } from "../../../domain/errors/MediaAccessError";

// backend/src/application/use-cases/feedback/DeleteMediaUseCase.ts
export interface DeleteMediaRequest {
    mediaUrls: string[];
    userId: string;
    userRole: string;
}

export class DeleteMediaUseCase {
    constructor(private storageService: S3StorageService) { }

    async execute(request: DeleteMediaRequest): Promise<void> {
        const { mediaUrls, userId, userRole } = request;

        if (!mediaUrls || !Array.isArray(mediaUrls)) {
            throw new Error('Invalid media URLs');
        }

        // Members may delete only their own uploads (community/<userId>/); admins any key in the bucket.
        const scope: MediaDeleteScope = userRole === 'ADMIN' ? { anyKey: true } : { ownerId: userId };
        if (!mediaUrls.every(url => this.storageService.canDeleteMediaUrl(url, scope))) {
            throw new MediaAccessError('You can only delete media you uploaded');
        }

        await this.storageService.deleteMultipleCommunityMedia(mediaUrls, scope);
    }
}
