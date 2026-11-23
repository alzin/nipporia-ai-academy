// backend/src/infrastructure/database/repositories/CourseRepository.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { CourseEntity } from '../entities/Course.entity';
import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { Course } from '../../../domain/entities/Course';

export class CourseRepository implements ICourseRepository {
  private repository: Repository<CourseEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(CourseEntity);
  }

  async create(course: Course): Promise<Course> {
    const entity = this.toEntity(course);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Course | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(isActive?: boolean): Promise<Course[]> {
    const where = isActive !== undefined ? { isActive } : {};
    const entities = await this.repository.find({
      where,
      order: { order: 'ASC' }
    });
    return entities.map(e => this.toDomain(e));
  }

  /** Courses with their lesson count and how many lessons anyone can watch (isFree or order <= freeLessonCount). */
  async findAllWithLessonCounts(isActive?: boolean): Promise<(Course & { lessonCount: number; freeLessonTotal: number })[]> {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    const entities = await this.repository.find({
      where,
      order: { order: 'ASC' },
      relations: ['lessons']
    });

    return entities.map(e => ({
      ...this.toDomain(e),
      lessonCount: e.lessons?.length || 0,
      freeLessonTotal: (e.lessons || []).filter((l) => l.isFree || l.order <= (e.freeLessonCount || 0)).length
    }));
  }

  async update(course: Course): Promise<Course> {
    const entity = this.toEntity(course);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  private toDomain(entity: CourseEntity): Course {
    return new Course(
      entity.id,
      entity.title,
      entity.description,
      entity.icon,
      entity.isActive,
      entity.freeLessonCount,
      entity.order,
      entity.createdAt,
      entity.updatedAt,
      entity.coverImageUrl ?? null
    );
  }

  private toEntity(course: Course): CourseEntity {
    const entity = new CourseEntity();
    entity.id = course.id;
    entity.title = course.title;
    entity.description = course.description;
    entity.icon = course.icon;
    entity.isActive = course.isActive;
    entity.freeLessonCount = course.freeLessonCount;
    entity.order = course.order;
    entity.coverImageUrl = course.coverImageUrl ?? null;
    entity.createdAt = course.createdAt;
    entity.updatedAt = course.updatedAt;
    return entity;
  }
}