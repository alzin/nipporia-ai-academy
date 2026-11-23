// backend/src/application/use-cases/dashboard/GetDashboardDataUseCase.ts
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';
import { IProgressRepository } from '../../../domain/repositories/IProgressRepository';
import { ILessonRepository } from '../../../domain/repositories/ILessonRepository';
import { IPostRepository } from '../../../domain/repositories/IPostRepository';
import { IRecentActivityRepository } from '../../../domain/repositories/IRecentActivityRepository';
import { RecentActivity } from '../../../domain/entities/RecentActivity';
import { CourseRepository } from '../../../infrastructure/database/repositories/CourseRepository';

export interface DashboardDataDTO {
    userId?: string;
    userRole?: string;
}

export interface DashboardCourse {
    id: string;
    title: string;
    description: string;
    icon: string;
    coverImageUrl: string | null;
    isActive: boolean;
    freeLessonCount: number;
    order: number;
    lessonCount: number;
    /** Lessons anyone can watch (isFree or within freeLessonCount). */
    freeLessonTotal: number;
}

export interface CourseProgress {
    courseId: string;
    courseTitle: string;
    totalLessons: number;
    completedLessons: number;
    progressPercentage: number;
}

export interface Achievement {
    id: string;
    title: string;
    earnedAt: Date;
}

export interface DashboardStats {
    totalLessonsCompleted: number;
    totalLessonsAvailable: number;
    communityPostsCount: number;
}

export interface DashboardData {
    /** null for guests */
    user: {
        id: string;
        email: string;
        role: string;
        name?: string;
    } | null;
    courses: DashboardCourse[];
    stats: DashboardStats;
    courseProgress: CourseProgress[];
    recentActivity: RecentActivity[];
    achievements: Achievement[];
}

export class GetDashboardDataUseCase {
    constructor(
        private userRepository: IUserRepository,
        private profileRepository: IProfileRepository,
        private progressRepository: IProgressRepository,
        private courseRepository: CourseRepository,
        private lessonRepository: ILessonRepository,
        private postRepository: IPostRepository,
        private activityRepository: IRecentActivityRepository,
    ) { }

    async execute(dto: DashboardDataDTO): Promise<DashboardData> {
        const onlyActive = dto.userRole === 'ADMIN' ? undefined : true;
        const courses: DashboardCourse[] = (await this.courseRepository.findAllWithLessonCounts(onlyActive))
            .map(c => ({
                id: c.id,
                title: c.title,
                description: c.description,
                icon: c.icon,
                coverImageUrl: c.coverImageUrl ?? null,
                isActive: c.isActive,
                freeLessonCount: c.freeLessonCount,
                order: c.order,
                lessonCount: c.lessonCount,
                freeLessonTotal: c.freeLessonTotal,
            }));

        const totalLessonsAvailable = courses.reduce((sum, c) => sum + c.lessonCount, 0);

        // Guest: course list + empty progress
        const user = dto.userId ? await this.userRepository.findById(dto.userId) : null;
        if (!dto.userId || !user) {
            return {
                user: null,
                courses,
                stats: {
                    totalLessonsCompleted: 0,
                    totalLessonsAvailable,
                    communityPostsCount: 0,
                },
                courseProgress: [],
                recentActivity: [],
                achievements: [],
            };
        }

        const profile = await this.profileRepository.findByUserId(user.id);

        // Progress for every visible course
        const courseProgress: CourseProgress[] = [];
        let totalLessonsCompleted = 0;

        for (const course of courses) {
            const lessons = await this.lessonRepository.findByCourseId(course.id);
            const completedLessons = await this.progressRepository.getCompletedLessonCount(
                user.id,
                course.id
            );
            totalLessonsCompleted += completedLessons;

            courseProgress.push({
                courseId: course.id,
                courseTitle: course.title,
                totalLessons: lessons.length,
                completedLessons,
                progressPercentage: lessons.length > 0
                    ? Math.round((completedLessons / lessons.length) * 100)
                    : 0,
            });
        }

        const userPosts = await this.postRepository.findByUserId(user.id);
        const communityPostsCount = userPosts.length;

        const recentActivity: RecentActivity[] = await this.activityRepository.findByUserId(user.id, 10);

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: profile?.name,
            },
            courses,
            stats: {
                totalLessonsCompleted,
                totalLessonsAvailable,
                communityPostsCount,
            },
            courseProgress,
            recentActivity,
            achievements: this.calculateAchievements(totalLessonsCompleted, communityPostsCount),
        };
    }

    private calculateAchievements(lessonsCompleted: number, postsCount: number): Achievement[] {
        const achievements: Achievement[] = [];

        if (lessonsCompleted >= 1) {
            achievements.push({ id: 'first-lesson', title: 'はじめてのレッスン', earnedAt: new Date() });
        }

        if (lessonsCompleted >= 10) {
            achievements.push({ id: 'lessons-10', title: 'レッスン10本', earnedAt: new Date() });
        }

        if (postsCount >= 3) {
            achievements.push({ id: 'community-active', title: 'コミュニティで活動中', earnedAt: new Date() });
        }

        return achievements;
    }
}
