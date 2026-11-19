// backend/src/infrastructure/web/routes/announcement.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { AnnouncementController } from '../controllers/announcement.controller';
import { authenticate, authorize, optionalAuthenticate, requireActiveSubscription } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';

const announcementRouter = (announcementController: AnnouncementController): Router => {
  const router = Router();

  const member = [authenticate, requireActiveSubscription];
  const admin = [authenticate, authorize('ADMIN')];

  // Announcement CRUD routes
  router.post(
    '/',
    ...admin,
    [
      body('content').notEmpty().trim().withMessage('Content is required')
    ],
    validateRequest,
    announcementController.createAnnouncement.bind(announcementController)
  );

  router.get(
    '/',
    optionalAuthenticate,
    announcementController.getAnnouncements.bind(announcementController));

  router.get(
    '/:announcementId',
    optionalAuthenticate,
    announcementController.getAnnouncementById.bind(announcementController));

  router.post(
    '/:announcementId/toggle-like',
    ...member,
    announcementController.toggleLike.bind(announcementController));

  router.put(
    '/:announcementId',
    ...admin,
    [
      body('content').notEmpty().trim().withMessage('Content is required')
    ],
    validateRequest,
    announcementController.editAnnouncement.bind(announcementController)
  );

  router.delete(
    '/:announcementId',
    ...admin,
    announcementController.deleteAnnouncement.bind(announcementController));

  // Comment routes for announcements
  router.get(
    '/:announcementId/comments',
    optionalAuthenticate,
    announcementController.getCommentsByAnnouncement.bind(announcementController));

  router.get(
    '/:announcementId/comments/count',
    optionalAuthenticate,
    announcementController.getCommentCount.bind(announcementController));

  router.post(
    '/:announcementId/comments',
    ...member,
    [
      body('content')
        .notEmpty()
        .trim()
        .isLength({ min: 1 })
        .withMessage('Comment content must be at least 1 character'),
      body('parentCommentId')
        .optional()
        .isString()
        .withMessage('Parent comment ID must be a string')
    ],
    validateRequest,
    announcementController.createComment.bind(announcementController)
  );

  router.delete(
    '/comments/:commentId',
    ...member,
    announcementController.deleteComment.bind(announcementController));

  // New route for editing a comment on an announcement
  router.put(
    '/comments/:commentId',
    ...member,
    [
      body('content')
        .notEmpty()
        .trim()
        .isLength({ min: 1 })
        .withMessage('Comment content must be at least 1 character'),
    ],
    validateRequest,
    announcementController.updateComment.bind(announcementController)
  );
  return router;
};

export default announcementRouter;