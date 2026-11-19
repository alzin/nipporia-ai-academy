import { RecentActivity, ActivityType } from '../../domain/entities/RecentActivity';

export interface IActivityService {
    logActivity(
        userId: string,
        type: ActivityType,
        title: string,
        description?: string,
        metadata?: Record<string, any>
    ): Promise<RecentActivity>;

    logUserRegistered(userId: string, email: string): Promise<RecentActivity>;
    logLessonCompleted(userId: string, lessonTitle: string): Promise<RecentActivity>;
    logPostCreated(userId: string, postId: string): Promise<RecentActivity>;
    logCourseCompleted(userId: string, courseTitle: string): Promise<RecentActivity>;
    logAchievementEarned(userId: string, achievementTitle: string, achievementId: string): Promise<RecentActivity>;
    logProfileUpdated(userId: string, updatedFields: string[]): Promise<RecentActivity>;
}
