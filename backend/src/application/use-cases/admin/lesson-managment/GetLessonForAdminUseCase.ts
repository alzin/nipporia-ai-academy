import { LessonRepository } from "../../../../infrastructure/database/repositories/LessonRepository";

/** Returns the raw lesson (including the stored isFree flag) for the admin lesson form. */
export class GetLessonForAdminUseCase {
    constructor(
        private readonly lessonRepository: LessonRepository
    ) { }

    async execute(lessonId: string) {
        const lesson = await this.lessonRepository.findById(lessonId);
        if (!lesson) {
            throw new Error('Lesson not found');
        }
        return lesson;
    }
}
