import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

// Import use cases
import { GetUsersUseCase } from '../../../application/use-cases/admin/user-managment/GetUsersUseCase';
import { UpdateUserStatusUseCase } from '../../../application/use-cases/admin/user-managment/UpdateUserStatusUseCase';

import { CreateCourseUseCase } from '../../../application/use-cases/admin/course-managment/CreateCourseUseCase';
import { UpdateCourseUseCase } from '../../../application/use-cases/admin/course-managment/UpdateCourseUseCase';
import { DeleteCourseUseCase } from '../../../application/use-cases/admin/course-managment/DeleteCourseUseCase';
import { CourseCoverError, CourseCoverUseCase } from '../../../application/use-cases/admin/course-managment/CourseCoverUseCase';

import { CreateLessonUseCase } from '../../../application/use-cases/admin/lesson-managment/CreateLessonUseCase';
import { UpdateLessonUseCase } from '../../../application/use-cases/admin/lesson-managment/UpdateLessonUseCase';
import { DeleteLessonUseCase } from '../../../application/use-cases/admin/lesson-managment/DeleteLessonUseCase';
import { GetLessonForAdminUseCase } from '../../../application/use-cases/admin/lesson-managment/GetLessonForAdminUseCase';

import { GetFlaggedPostsUseCase } from '../../../application/use-cases/admin/post-managment/GetFlaggedPostsUseCase';
import { DeletePostUseCase } from '../../../application/use-cases/admin/post-managment/DeletePostUseCase';
import { UnflagPostUseCase } from '../../../application/use-cases/admin/post-managment/UnflagPostUseCase';

import { GetAnalyticsOverviewUseCase } from '../../../application/use-cases/admin/analytics-managment/GetAnalyticsOverviewUseCase';
import { GetRevenueAnalyticsUseCase } from '../../../application/use-cases/admin/analytics-managment/GetRevenueAnalyticsUseCase';
import { GetEngagementAnalyticsUseCase } from '../../../application/use-cases/admin/analytics-managment/GetEngagementAnalyticsUseCase';

import { CreatePostUseCase } from '../../../application/use-cases/community/CreatePostUseCase';

import { LessonType } from '../../../domain/entities/Lesson';

export class AdminController {

  constructor(
    // User Management Use Cases
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly updateUserStatusUseCase: UpdateUserStatusUseCase,

    // Course Management Use Cases
    private readonly createCourseUseCase: CreateCourseUseCase,
    private readonly updateCourseUseCase: UpdateCourseUseCase,
    private readonly deleteCourseUseCase: DeleteCourseUseCase,
    private readonly courseCoverUseCase: CourseCoverUseCase,

    // Lesson Management Use Cases
    private readonly createLessonUseCase: CreateLessonUseCase,
    private readonly updateLessonUseCase: UpdateLessonUseCase,
    private readonly deleteLessonUseCase: DeleteLessonUseCase,
    private readonly getLessonForAdminUseCase: GetLessonForAdminUseCase,


    // Post Management Use Cases
    private readonly getFlaggedPostsUseCase: GetFlaggedPostsUseCase,
    private readonly deletePostUseCase: DeletePostUseCase,
    private readonly unflagPostUseCase: UnflagPostUseCase,

    // Analytics Use Cases
    private readonly getAnalyticsOverviewUseCase: GetAnalyticsOverviewUseCase,
    private readonly getRevenueAnalyticsUseCase: GetRevenueAnalyticsUseCase,
    private readonly getEngagementAnalyticsUseCase: GetEngagementAnalyticsUseCase,

    // Community Use Cases
    private readonly createPostUseCase: CreatePostUseCase
  ) { }

  // ========== USER MANAGEMENT ==========

  private parseArrayQuery(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async getUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        roles,
        statuses,
        subscriptions,
        dateFrom,
        dateTo,
        sortField,
        sortOrder,
      } = req.query;

      const result = await this.getUsersUseCase.execute({
        page: Number(page),
        limit: Number(limit),
        search: search ? String(search) : undefined,
        roles: this.parseArrayQuery(roles),
        statuses: this.parseArrayQuery(statuses),
        subscriptions: this.parseArrayQuery(subscriptions),
        dateFrom: dateFrom ? String(dateFrom) : undefined,
        dateTo: dateTo ? String(dateTo) : undefined,
        sortField: sortField as "joined" | "name" | undefined,
        sortOrder: sortOrder as "asc" | "desc" | undefined,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      const result = await this.updateUserStatusUseCase.execute(userId, isActive);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  // ========== COURSE MANAGEMENT ==========

  async createCourse(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, icon, freeLessonCount = 0 } = req.body;

      const course = await this.createCourseUseCase.execute({
        title,
        description,
        icon,
        freeLessonCount: Number(freeLessonCount) || 0
      });

      res.status(201).json(course);
    } catch (error) {
      next(error);
    }
  }

  async updateCourse(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;
      const updates = req.body;

      const updated = await this.updateCourseUseCase.execute(courseId, updates);
      res.json(updated);
    } catch (error: any) {
      if (error.message === 'Course not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  async deleteCourse(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;
      const result = await this.deleteCourseUseCase.execute(courseId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Course not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  /** POST /admin/courses/:courseId/cover (multipart, field "cover"): upload or replace the cover. */
  async uploadCourseCover(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        res.status(400).json({ error: '画像ファイルを選んでください。' });
        return;
      }
      const course = await this.courseCoverUseCase.upload(req.params.courseId, req.user!.userId, {
        buffer: file.buffer,
        filename: file.originalname,
        mimeType: file.mimetype,
      });
      res.json(course);
    } catch (error: any) {
      if (error instanceof CourseCoverError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  /** DELETE /admin/courses/:courseId/cover: remove the cover (cards fall back to the icon). */
  async removeCourseCover(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const course = await this.courseCoverUseCase.remove(req.params.courseId);
      res.json(course);
    } catch (error: any) {
      if (error instanceof CourseCoverError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  // ========== LESSON MANAGEMENT ==========

  async createLesson(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;
      const {
        title,
        description,
        order,
        lessonType,
        contentUrl,
        contentData,
        audioFiles,
        resources,
        requiresReflection,
        isFree,
        passingScore
      } = req.body;

      const lesson = await this.createLessonUseCase.execute({
        courseId,
        title,
        description,
        order: Number(order),
        lessonType: lessonType as LessonType | undefined,
        contentUrl,
        contentData,
        audioFiles,
        resources,
        requiresReflection: requiresReflection === true,
        isFree: isFree === true,
        passingScore: passingScore !== undefined && passingScore !== null ? Number(passingScore) : undefined
      });

      res.status(201).json(lesson);
    } catch (error) {
      console.error('Error in createLesson:', error);
      next(error);
    }
  }

  async updateLesson(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lessonId } = req.params;
      const updates = req.body;

      const updated = await this.updateLessonUseCase.execute(lessonId, updates);
      res.json(updated);
    } catch (error: any) {
      if (error.message === 'Lesson not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  async deleteLesson(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lessonId } = req.params;
      const result = await this.deleteLessonUseCase.execute(lessonId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Lesson not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  async getLesson(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lessonId } = req.params;
      const result = await this.getLessonForAdminUseCase.execute(lessonId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Lesson not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  // ========== POST MANAGEMENT ==========

  async getFlaggedPosts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const posts = await this.getFlaggedPostsUseCase.execute();
      res.json(posts);
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId } = req.params;
      const result = await this.deletePostUseCase.execute(postId);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Post not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  async unflagPost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId } = req.params;
      const result = await this.unflagPostUseCase.execute(postId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ========== ANALYTICS ==========

  async getAnalyticsOverview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const analyticsData = await this.getAnalyticsOverviewUseCase.execute();
      res.json(analyticsData);
    } catch (error) {
      next(error);
    }
  }

  async getRevenueAnalytics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const revenueData = await this.getRevenueAnalyticsUseCase.execute();
      res.json(revenueData);
    } catch (error) {
      next(error);
    }
  }

  async getEngagementAnalytics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const engagementData = await this.getEngagementAnalyticsUseCase.execute();
      res.json(engagementData);
    } catch (error) {
      next(error);
    }
  }

  // ========== ANNOUNCEMENTS ==========

  async createAnnouncement(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { content } = req.body;

      const post = await this.createPostUseCase.execute({
        userId: req.user!.userId,
        content,
      });

      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  }

}
