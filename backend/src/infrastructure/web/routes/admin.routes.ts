// backend/src/infrastructure/web/routes/admin.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import multer from 'multer';
import { LessonType } from '../../../domain/entities/Lesson';
import { COURSE_COVER_MAX_BYTES } from '../../../application/use-cases/admin/course-managment/CourseCoverUseCase';

const adminRouter = (adminController: AdminController): Router => {
  const router = Router();

  // All admin routes require authentication and admin role
  router.use(authenticate, authorize('ADMIN'));

  // User management
  router.get('/users', adminController.getUsers.bind(adminController));
  router.put('/users/:userId/status', adminController.updateUserStatus.bind(adminController));

  // Content management
  router.get('/posts/flagged', adminController.getFlaggedPosts.bind(adminController));
  router.delete('/posts/:postId', adminController.deletePost.bind(adminController));
  router.post('/posts/:postId/unflag', adminController.unflagPost.bind(adminController));

  // Course management
  router.post(
    '/courses',
    [
      body('title').notEmpty(),
      body('description').notEmpty(),
      body('icon').notEmpty(),
      body('freeLessonCount').optional().isInt({ min: 0 })
    ],
    validateRequest,
    adminController.createCourse.bind(adminController)
  );
  router.put(
    '/courses/:courseId',
    [
      body('title').optional().notEmpty(),
      body('description').optional().notEmpty(),
      body('icon').optional().notEmpty(),
      body('isActive').optional().isBoolean(),
      body('freeLessonCount').optional().isInt({ min: 0 }),
      body('order').optional().isInt({ min: 0 })
    ],
    validateRequest,
    adminController.updateCourse.bind(adminController)
  );
  router.delete('/courses/:courseId', adminController.deleteCourse.bind(adminController));

  // Course cover image (16:9, JPG / PNG / WebP, up to 5MB)
  const coverUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: COURSE_COVER_MAX_BYTES, files: 1 },
  }).single('cover');
  router.post(
    '/courses/:courseId/cover',
    (req, res, next) => coverUpload(req, res, (err: any) => {
      if (err) {
        const tooLarge = err.code === 'LIMIT_FILE_SIZE';
        res.status(400).json({ error: tooLarge ? '画像は5MBまでにしてください。' : '画像をアップロードできませんでした。' });
        return;
      }
      next();
    }),
    adminController.uploadCourseCover.bind(adminController)
  );
  router.delete('/courses/:courseId/cover', adminController.removeCourseCover.bind(adminController));

  // Lesson management
  const lessonTypes = Object.values(LessonType);
  router.post(
    '/courses/:courseId/lessons',
    [
      body('title').notEmpty(),
      body('description').notEmpty(),
      body('order').isInt({ min: 1 }),
      body('lessonType').optional().isIn(lessonTypes),
      body('isFree').optional().isBoolean({ strict: true }),
      body('requiresReflection').optional().isBoolean({ strict: true }),
      body('passingScore').optional({ values: 'null' }).isInt({ min: 0, max: 100 })
    ],
    validateRequest,
    adminController.createLesson.bind(adminController)
  );
  router.put(
    '/lessons/:lessonId',
    [
      body('title').optional().notEmpty(),
      body('description').optional().notEmpty(),
      body('order').optional().isInt({ min: 1 }),
      body('lessonType').optional().isIn(lessonTypes),
      body('isFree').optional().isBoolean({ strict: true }),
      body('requiresReflection').optional().isBoolean({ strict: true }),
      body('passingScore').optional({ values: 'null' }).isInt({ min: 0, max: 100 })
    ],
    validateRequest,
    adminController.updateLesson.bind(adminController)
  );
  router.delete('/lessons/:lessonId', adminController.deleteLesson.bind(adminController));
  router.get('/lessons/:lessonId', adminController.getLesson.bind(adminController));

  // Analytics
  router.get('/analytics/overview', adminController.getAnalyticsOverview.bind(adminController));
  router.get('/analytics/revenue', adminController.getRevenueAnalytics.bind(adminController));
  router.get('/analytics/engagement', adminController.getEngagementAnalytics.bind(adminController));

  // Announcements (posted as a community post by the admin)
  router.post(
    '/announcements',
    [
      body('content').notEmpty().trim()
    ],
    validateRequest,
    adminController.createAnnouncement.bind(adminController)
  );

  return router;
};

export default adminRouter;
