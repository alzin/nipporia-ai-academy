export interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** Main cover image (16:9). Optional; cards keep their plain look without it. */
  coverImageUrl?: string | null;
  isActive: boolean;
  freeLessonCount?: number;
  lessonCount?: number;
  /** Lessons anyone can watch (flagged free or within freeLessonCount). */
  freeLessonTotal?: number;
}

export interface CourseProgress {
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  completionPercentage: number;
}

export interface CourseCardProps {
  course: Course;
  onClick: () => void;
  isEnrolled: boolean;
  progress?: number;
  lessonCount?: number;
  completedCount?: number;
}
