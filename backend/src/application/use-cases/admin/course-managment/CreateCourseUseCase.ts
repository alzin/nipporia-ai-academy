import { CourseRepository } from "../../../../infrastructure/database/repositories/CourseRepository";
import { Course } from "../../../../domain/entities/Course";

interface CreateCourseInput {
    title: string;
    description: string;
    icon: string;
    freeLessonCount?: number;
}

export class CreateCourseUseCase {
    constructor(
        private readonly courseRepository: CourseRepository
    ) { }

    async execute(input: CreateCourseInput) {
        // Place the new course at the end
        const existingCourses = await this.courseRepository.findAll();
        const maxOrder = existingCourses.length > 0
            ? Math.max(...existingCourses.map(c => c.order || 0))
            : 0;

        const course = new Course(
            `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            input.title,
            input.description,
            input.icon,
            true,
            input.freeLessonCount || 0,
            maxOrder + 1,
            new Date(),
            new Date()
        );

        return await this.courseRepository.create(course);
    }
}
