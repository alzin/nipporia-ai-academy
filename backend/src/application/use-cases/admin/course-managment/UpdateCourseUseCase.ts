import { CourseRepository } from "../../../../infrastructure/database/repositories/CourseRepository";

const UPDATABLE_FIELDS = ['title', 'description', 'icon', 'isActive', 'freeLessonCount', 'order'] as const;

export class UpdateCourseUseCase {
    constructor(
        private readonly courseRepository: CourseRepository
    ) { }

    async execute(courseId: string, updates: any) {
        const course = await this.courseRepository.findById(courseId);

        if (!course) {
            throw new Error('Course not found');
        }

        for (const field of UPDATABLE_FIELDS) {
            if (updates?.[field] !== undefined) {
                (course as any)[field] = updates[field];
            }
        }
        course.updatedAt = new Date();

        return await this.courseRepository.update(course);
    }
}
