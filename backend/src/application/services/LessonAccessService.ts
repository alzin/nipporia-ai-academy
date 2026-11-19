// backend/src/application/services/LessonAccessService.ts
// Single place that decides whether a lesson is free / locked for a viewer
// and shapes the lesson payload accordingly. Used by GetCourseLessonsUseCase,
// GetLessonByIdUseCase and CompleteLessonUseCase.
import { Lesson } from '../../domain/entities/Lesson';
import { Course } from '../../domain/entities/Course';
import { Progress } from '../../domain/entities/Progress';
import { CheckUserSubscriptionUseCase } from '../use-cases/subscription/CheckUserSubscriptionUseCase';

export interface Viewer {
    userId?: string;
    role?: string;
}

export interface LockedLessonView {
    id: string;
    courseId: string;
    title: string;
    description: string;
    order: number;
    lessonType: string;
    isFree: boolean;
    isLocked: true;
    isCompleted: boolean;
    completedAt?: Date;
}

export interface UnlockedLessonView {
    id: string;
    courseId: string;
    title: string;
    description: string;
    order: number;
    lessonType: string;
    isFree: boolean;
    isLocked: false;
    contentUrl?: string;
    contentData?: any;
    audioFiles: string[];
    resources: string[];
    requiresReflection: boolean;
    passingScore?: number;
    isCompleted: boolean;
    completedAt?: Date;
}

export type LessonView = LockedLessonView | UnlockedLessonView;

/** A lesson is free when it is flagged isFree or falls within the course's free lesson count. */
export function isLessonFree(lesson: Lesson, course: Course | null): boolean {
    if (lesson.isFree) return true;
    const freeLessonCount = course?.freeLessonCount ?? 0;
    return lesson.order <= freeLessonCount;
}

/** Locked unless the lesson is free or the viewer has full access (active subscriber / ADMIN). */
export function isLessonLocked(lesson: Lesson, course: Course | null, hasFullAccess: boolean): boolean {
    if (hasFullAccess) return false;
    return !isLessonFree(lesson, course);
}

/**
 * Shape a lesson for the API. Locked lessons never include contentUrl,
 * contentData, audioFiles or resources.
 */
export function toLessonView(
    lesson: Lesson,
    course: Course | null,
    hasFullAccess: boolean,
    progress?: Progress | null
): LessonView {
    const isFree = isLessonFree(lesson, course);
    const locked = !hasFullAccess && !isFree;
    const isCompleted = progress?.isCompleted || false;
    const completedAt = progress?.completedAt;

    if (locked) {
        return {
            id: lesson.id,
            courseId: lesson.courseId,
            title: lesson.title,
            description: lesson.description,
            order: lesson.order,
            lessonType: lesson.lessonType,
            isFree,
            isLocked: true,
            isCompleted,
            completedAt,
        };
    }

    return {
        id: lesson.id,
        courseId: lesson.courseId,
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        lessonType: lesson.lessonType,
        isFree,
        isLocked: false,
        contentUrl: lesson.contentUrl,
        contentData: lesson.contentData,
        audioFiles: lesson.audioFiles,
        resources: lesson.resources,
        requiresReflection: lesson.requiresReflection,
        passingScore: lesson.passingScore,
        isCompleted,
        completedAt,
    };
}

export class LessonAccessService {
    constructor(private checkUserSubscriptionUseCase: CheckUserSubscriptionUseCase) { }

    /** Guests: false. ADMIN: true. Otherwise: the existing subscription check (active / trialing). */
    async hasFullAccess(viewer: Viewer): Promise<boolean> {
        if (!viewer.userId) return false;
        if (viewer.role === 'ADMIN') return true;
        return this.checkUserSubscriptionUseCase.hasActiveAccess(viewer.userId);
    }
}
