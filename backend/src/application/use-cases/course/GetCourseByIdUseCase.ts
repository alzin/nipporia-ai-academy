// backend/src/application/use-cases/course/GetCourseByIdUseCase.ts
import { CourseRepository } from "../../../infrastructure/database/repositories/CourseRepository";

export interface GetCourseByIdRequest {
    courseId: string;
    userRole?: string;
}

export class GetCourseByIdUseCase {
    constructor(private courseRepository: CourseRepository) { }

    async execute(request: GetCourseByIdRequest): Promise<any> {
        const { courseId, userRole } = request;

        const course = await this.courseRepository.findById(courseId);

        if (!course || (!course.isActive && userRole !== 'ADMIN')) {
            throw new Error('Course not found');
        }

        return course;
    }
}
