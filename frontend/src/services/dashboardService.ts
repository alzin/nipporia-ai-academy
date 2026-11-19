// frontend/src/services/dashboardService.ts
import api from './api';

export interface DashboardStats {
    totalLessonsCompleted: number;
    totalLessonsAvailable: number;
    communityPostsCount: number;
}

export interface CourseProgress {
    courseId: string;
    courseTitle: string;
    totalLessons: number;
    completedLessons: number;
    progressPercentage: number;
}

export enum ActivityType {
    USER_REGISTERED = 'USER_REGISTERED',
    LESSON_COMPLETED = 'LESSON_COMPLETED',
    POST_CREATED = 'POST_CREATED',
    COURSE_COMPLETED = 'COURSE_COMPLETED',
    PROFILE_UPDATED = 'PROFILE_UPDATED'
}

export interface RecentActivity {
    id: string;
    userId: string;
    activityType: string;
    title: string;
    description?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    user?: {
        id: string;
        email: string;
        name: string;
    };
}

export interface DashboardData {
    user: {
        id: string;
        email: string;
        role: string;
        name?: string;
    };
    stats: DashboardStats;
    courseProgress: CourseProgress[];
    recentActivity: RecentActivity[];
}

export const dashboardService = {
    async getDashboardData(): Promise<DashboardData> {
        const response = await api.get('/dashboard/data');
        return response.data;
    },
};