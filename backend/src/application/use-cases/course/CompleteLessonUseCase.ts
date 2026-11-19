// backend/src/application/use-cases/course/CompleteLessonUseCase.ts
import { ILessonRepository } from '../../../domain/repositories/ILessonRepository';
import { IProgressRepository } from '../../../domain/repositories/IProgressRepository';
import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { Progress } from '../../../domain/entities/Progress';
import { ActivityService } from '../../../infrastructure/services/ActivityService';
import { LessonAccessService, isLessonLocked } from '../../services/LessonAccessService';

export interface CompleteLessonDTO {
  userId: string;
  userRole?: string;
  lessonId: string;
  reflectionContent?: string;
  quizScore?: number;
}

export const LESSON_LOCKED_ERROR = 'LESSON_LOCKED';

export class CompleteLessonUseCase {
  constructor(
    private lessonRepository: ILessonRepository,
    private progressRepository: IProgressRepository,
    private courseRepository: ICourseRepository,
    private lessonAccessService: LessonAccessService,
    private activityService: ActivityService
  ) { }

  async execute(dto: CompleteLessonDTO): Promise<Progress> {
    const lesson = await this.lessonRepository.findById(dto.lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const course = await this.courseRepository.findById(lesson.courseId);
    const hasFullAccess = await this.lessonAccessService.hasFullAccess({
      userId: dto.userId,
      role: dto.userRole,
    });
    if (isLessonLocked(lesson, course, hasFullAccess)) {
      throw new Error(LESSON_LOCKED_ERROR);
    }

    // Check if reflection is required
    if (lesson.requiresReflection && !dto.reflectionContent) {
      throw new Error('Reflection is required for this lesson');
    }

    // Check if quiz score meets passing criteria
    if (lesson.lessonType === 'QUIZ' && lesson.passingScore) {
      if (!dto.quizScore || dto.quizScore < lesson.passingScore) {
        throw new Error(`Quiz score must be at least ${lesson.passingScore}% to complete this lesson`);
      }
    }

    // Check existing progress
    let progress = await this.progressRepository.findByUserAndLesson(dto.userId, dto.lessonId);

    if (progress) {
      if (progress.isCompleted) {
        throw new Error('Lesson already completed');
      }
      progress.markAsCompleted();
      if (lesson.requiresReflection) {
        progress.reflectionSubmitted = true;
      }
      if (dto.quizScore !== undefined) {
        progress.quizScore = dto.quizScore;
      }
    } else {
      progress = new Progress(
        `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        dto.userId,
        dto.lessonId,
        lesson.courseId,
        true,
        new Date(),
        lesson.requiresReflection,
        dto.quizScore,
        new Date(),
        new Date()
      );
    }

    const savedProgress = await this.progressRepository.update(progress);

    await this.activityService.logLessonCompleted(dto.userId, lesson.title);

    return savedProgress;
  }
}
