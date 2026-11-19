import { LessonRepository } from "../../../../infrastructure/database/repositories/LessonRepository";

const UPDATABLE_FIELDS = [
    'title',
    'description',
    'order',
    'lessonType',
    'contentUrl',
    'contentData',
    'audioFiles',
    'resources',
    'requiresReflection',
    'isFree',
    'passingScore',
] as const;

export class UpdateLessonUseCase {
    constructor(
        private readonly lessonRepository: LessonRepository
    ) { }

    async execute(lessonId: string, updates: any) {
        const lesson = await this.lessonRepository.findById(lessonId);

        if (!lesson) {
            throw new Error('Lesson not found');
        }

        for (const field of UPDATABLE_FIELDS) {
            if (updates?.[field] !== undefined) {
                (lesson as any)[field] = updates[field];
            }
        }
        lesson.updatedAt = new Date();

        return await this.lessonRepository.update(lesson);
    }
}
