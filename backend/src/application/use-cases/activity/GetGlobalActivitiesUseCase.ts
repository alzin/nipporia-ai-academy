import { RecentActivityRepository } from "../../../infrastructure/database/repositories/RecentActivityRepository";
import { UserRepository } from "../../../infrastructure/database/repositories/UserRepository";
import { ProfileRepository } from "../../../infrastructure/database/repositories/ProfileRepository";

export class GetGlobalActivitiesUseCase {
    constructor(
        private readonly activityRepository: RecentActivityRepository,
        private readonly userRepository: UserRepository,
        private readonly profileRepository: ProfileRepository
    ) { }

    async execute(limit: number = 50) {
        const activities = await this.activityRepository.findGlobalRecent(limit);

        // Enhance activities with user information
        const enhancedActivities = await Promise.all(
            activities.map(async (activity) => {
                const user = await this.userRepository.findById(activity.userId);
                const profile = await this.profileRepository.findByUserId(activity.userId);

                return {
                    ...activity,
                    user: {
                        id: user?.id,
                        email: user?.email, // admin-only route
                        name: profile?.name || 'メンバー',
                    },
                };
            })
        );

        return { activities: enhancedActivities };
    }
}