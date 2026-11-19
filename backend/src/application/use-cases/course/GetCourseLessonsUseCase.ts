// backend/src/application/use-cases/course/GetCourseLessonsUseCase.ts
import { LessonRepository } from '../../../infrastructure/database/repositories/LessonRepository';
import { ProgressRepository } from '../../../infrastructure/database/repositories/ProgressRepository';
import { CourseRepository } from '../../../infrastructure/database/repositories/CourseRepository';
import { LessonAccessService, LessonView, toLessonView } from '../../services/LessonAccessService';

export interface GetCourseLessonsRequest {
    courseId: string;
    userId?: string;
    userRole?: string;
}

export class GetCourseLessonsUseCase {
    constructor(
        private lessonRepository: LessonRepository,
        private progressRepository: ProgressRepository,
        private courseRepository: CourseRepository,
        private lessonAccessService: LessonAccessService
    ) { }

    async execute(request: GetCourseLessonsRequest): Promise<LessonView[]> {
        const { courseId, userId, userRole } = request;

        const course = await this.courseRepository.findById(courseId);
        if (!course || (!course.isActive && userRole !== 'ADMIN')) {
            throw new Error('Course not found');
        }

        const lessons = await this.lessonRepository.findByCourseId(courseId);
        const progress = userId
            ? await this.progressRepository.findByUserAndCourse(userId, courseId)
            : [];
        const hasFullAccess = await this.lessonAccessService.hasFullAccess({ userId, role: userRole });

        return lessons.map(lesson =>
            toLessonView(
                lesson,
                course,
                hasFullAccess,
                progress.find(p => p.lessonId === lesson.id),
                userRole
            )
        );
    }
}
