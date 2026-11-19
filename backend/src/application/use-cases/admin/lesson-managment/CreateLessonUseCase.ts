import { LessonRepository } from "../../../../infrastructure/database/repositories/LessonRepository";
import { Lesson, LessonType } from "../../../../domain/entities/Lesson";

interface CreateLessonInput {
    courseId: string;
    title: string;
    description: string;
    order: number;
    lessonType?: LessonType;
    contentUrl?: string;
    contentData?: any;
    audioFiles?: string[];
    resources?: any[];
    requiresReflection?: boolean;
    isFree?: boolean;
    passingScore?: number;
}

export class CreateLessonUseCase {
    constructor(
        private readonly lessonRepository: LessonRepository
    ) { }

    async execute(input: CreateLessonInput) {
        const lesson = new Lesson(
            `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            input.courseId,
            input.title,
            input.description,
            input.order,
            input.lessonType || LessonType.VIDEO,
            input.contentUrl,
            input.contentData,
            input.audioFiles || [],
            input.resources || [],
            input.requiresReflection || false,
            input.isFree === true,
            input.passingScore,
            new Date(),
            new Date()
        );

        return await this.lessonRepository.create(lesson);
    }
}
