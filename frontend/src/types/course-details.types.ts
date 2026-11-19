// types.ts
export interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
  isActive: boolean;
  freeLessonCount?: number;
}

export type LessonType = "VIDEO" | "PDF" | "QUIZ" | "SLIDES";

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessonType: LessonType;
  contentUrl?: string;
  /** Video stored on our servers: played as an encrypted stream via /media (no file URL is sent). */
  hasProtectedVideo?: boolean;
  contentData?: any;
  requiresReflection?: boolean;
  passingScore?: number;
  isCompleted?: boolean;
  completedAt?: string;
  /** Free lesson: playable for everyone (set by the server). */
  isFree?: boolean;
  /** Locked for the current visitor: the server sent metadata only. */
  isLocked?: boolean;
}

export interface Enrollment {
  id: string;
  courseId: string;
  enrolledAt: string;
  course?: Course;
}

export interface CourseProgress {
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  completionPercentage: number;
}
