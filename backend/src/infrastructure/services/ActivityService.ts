import { IActivityService } from '../../domain/services/IActivityService';
import { RecentActivity, ActivityType } from '../../domain/entities/RecentActivity';
import { RecentActivityRepository } from '../database/repositories/RecentActivityRepository';

export class ActivityService implements IActivityService {
    private activityRepository: RecentActivityRepository;

    constructor() {
        this.activityRepository = new RecentActivityRepository();
    }

    async logActivity(
        userId: string,
        type: ActivityType,
        title: string,
        description?: string,
        metadata?: Record<string, any>
    ): Promise<RecentActivity> {
        const activity = new RecentActivity(
            `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            userId,
            type,
            title,
            description,
            metadata,
            new Date()
        );

        return await this.activityRepository.create(activity);
    }

    async logUserRegistered(userId: string, email: string): Promise<RecentActivity> {
        return this.logActivity(
            userId,
            ActivityType.USER_REGISTERED,
            'Nipporia AI Academy に登録しました',
            undefined,
            { email }
        );
    }

    async logLessonCompleted(userId: string, lessonTitle: string): Promise<RecentActivity> {
        return this.logActivity(
            userId,
            ActivityType.LESSON_COMPLETED,
            `「${lessonTitle}」を完了しました`,
            undefined,
            { lessonTitle }
        );
    }

    async logPostCreated(userId: string, postId: string): Promise<RecentActivity> {
        return this.logActivity(
            userId,
            ActivityType.POST_CREATED,
            'コミュニティに投稿しました',
            undefined,
            { postId }
        );
    }

    async logCourseCompleted(userId: string, courseTitle: string): Promise<RecentActivity> {
        return this.logActivity(
            userId,
            ActivityType.COURSE_COMPLETED,
            `「${courseTitle}」を修了しました`,
            undefined,
            { courseTitle }
        );
    }

    async logAchievementEarned(userId: string, achievementTitle: string, achievementId: string): Promise<RecentActivity> {
        return this.logActivity(
            userId,
            ActivityType.ACHIEVEMENT_EARNED,
            `「${achievementTitle}」を達成しました`,
            undefined,
            { achievementTitle, achievementId }
        );
    }

    async logProfileUpdated(userId: string, updatedFields: string[]): Promise<RecentActivity> {
        return this.logActivity(
            userId,
            ActivityType.PROFILE_UPDATED,
            'プロフィールを更新しました',
            undefined,
            { updatedFields }
        );
    }
}
