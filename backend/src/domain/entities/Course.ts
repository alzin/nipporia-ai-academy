// backend/src/domain/entities/Course.ts
export interface ICourse {
  id: string;
  title: string;
  description: string;
  icon: string;
  isActive: boolean;
  freeLessonCount: number;
  order: number;
  /** Main cover image (plain S3 object URL; signed on the way out). */
  coverImageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Course implements ICourse {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public icon: string,
    public isActive: boolean,
    public freeLessonCount: number,
    public order: number,
    public createdAt: Date,
    public updatedAt: Date,
    public coverImageUrl: string | null = null
  ) { }
}
