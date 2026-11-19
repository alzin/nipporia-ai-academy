// backend/src/application/use-cases/course/GetLessonByIdUseCase.ts
import { LessonRepository } from "../../../infrastructure/database/repositories/LessonRepository";
import { ProgressRepository } from "../../../infrastructure/database/repositories/ProgressRepository";
import { CourseRepository } from "../../../infrastructure/database/repositories/CourseRepository";
import { LessonAccessService, LessonView, toLessonView } from "../../services/LessonAccessService";

export interface GetLessonByIdRequest {
    lessonId: string;
    userId?: string;
    userRole?: string;
}

export class GetLessonByIdUseCase {
    constructor(
        private lessonRepository: LessonRepository,
        private progressRepository: ProgressRepository,
        private courseRepository: CourseRepository,
        private lessonAccessService: LessonAccessService
    ) { }

    async execute(request: GetLessonByIdRequest): Promise<LessonView> {
        const { lessonId, userId, userRole } = request;

        const lesson = await this.lessonRepository.findById(lessonId);
        if (!lesson) {
            throw new Error('Lesson not found');
        }

        const course = await this.courseRepository.findById(lesson.courseId);
        if (!course || (!course.isActive && userRole !== 'ADMIN')) {
            throw new Error('Lesson not found');
        }

        const progress = userId
            ? await this.progressRepository.findByUserAndLesson(userId, lessonId)
            : null;
        const hasFullAccess = await this.lessonAccessService.hasFullAccess({ userId, role: userRole });

        return toLessonView(lesson, course, hasFullAccess, progress);
    }
}
