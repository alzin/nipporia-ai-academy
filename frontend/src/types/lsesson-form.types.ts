export type LessonType = "VIDEO" | "PDF" | "QUIZ" | "SLIDES";

export interface LessonFormState {
  id?: string;
  title: string;
  description: string;
  order: number;
  lessonType: LessonType;
  contentUrl: string;
  contentData: any;
  requiresReflection: boolean;
  passingScore: number;
  /** 無料公開: playable by everyone, guests included */
  isFree: boolean;
}
