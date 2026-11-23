// backend/src/infrastructure/database/entities/Course.entity.ts
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { LessonEntity } from './Lesson.entity';

@Entity('courses')
export class CourseEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column()
  icon!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 0 })
  freeLessonCount!: number;

  @Column({ default: 1 })
  order!: number;

  @Column({ type: 'varchar', nullable: true })
  coverImageUrl!: string | null;

  @OneToMany(() => LessonEntity, lesson => lesson.course)
  lessons!: LessonEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
