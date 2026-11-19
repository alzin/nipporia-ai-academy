// backend/src/application/use-cases/profile/UpdateProfileUseCase.ts
import { ProfileRepository } from "../../../infrastructure/database/repositories/ProfileRepository";

export interface UpdateProfileRequest {
    userId: string;
    name: string;
}

export class UpdateProfileUseCase {
    constructor(private profileRepository: ProfileRepository) { }

    async execute(request: UpdateProfileRequest): Promise<any> {
        const { userId, name } = request;

        const profile = await this.profileRepository.findByUserId(userId);
        if (!profile) {
            throw new Error('Profile not found');
        }

        if (typeof name !== 'string' || name.trim().length === 0) {
            throw new Error('Name must be a non-empty string');
        }
        profile.name = name.trim();
        profile.updatedAt = new Date();

        return this.profileRepository.update(profile);
    }
}
