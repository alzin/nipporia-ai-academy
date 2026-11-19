// backend/src/infrastructure/web/routes/feedback.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import { FeedbackController } from '../controllers/feedback.controller';
import { authenticate, optionalAuthenticate, requireActiveSubscription } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';

const feedbackRouter = (feedbackController: FeedbackController): Router => {
  const router = Router();


  // Configure multer for media uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max file size
      files: 10, // Maximum 10 files at once
    },
    fileFilter: (req, file, cb) => {
      // Allowed file types
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
      const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`));
      }
    },
  });

  const member = [authenticate, requireActiveSubscription];

  // Media upload routes
  router.post(
    '/upload-media',
    ...member,
    upload.array('media', 10), // Accept up to 10 files with field name 'media'
    feedbackController.uploadMedia.bind(feedbackController)
  );

  router.delete(
    '/delete-media',
    ...member,
    [
      body('mediaUrls')
        .isArray()
        .withMessage('Media URLs must be an array')
        .notEmpty()
        .withMessage('Media URLs array cannot be empty')
    ],
    validateRequest,
    feedbackController.deleteMedia.bind(feedbackController)
  );

  // Feedback CRUD routes
  router.post(
    '/',
    ...member,
    [
      body('content')
        .notEmpty()
        .trim(),
      body('mediaUrls')
        .optional()
        .isArray()
        .withMessage('Media URLs must be an array')
    ],
    validateRequest,
    feedbackController.createFeedback.bind(feedbackController)
  );

  router.get(
    '/',
    optionalAuthenticate,
    feedbackController.getFeedback.bind(feedbackController));

  router.get(
    '/:feedbackId',
    optionalAuthenticate,
    feedbackController.getFeedbackById.bind(feedbackController));

  router.put(
    '/:feedbackId',
    ...member,
    [
      body('content')
        .notEmpty()
        .trim(),
      body('mediaUrls')
        .optional()
        .isArray()
        .withMessage('Media URLs must be an array'),
      body('removedMediaUrls')
        .optional()
        .isArray()
        .withMessage('Removed media URLs must be an array')
    ],
    validateRequest,
    feedbackController.updateFeedback.bind(feedbackController)
  );

  router.delete(
    '/:feedbackId',
    ...member,
    feedbackController.deleteFeedback.bind(feedbackController));

  // Like functionality
  router.post(
    '/:feedbackId/toggle-like',
    ...member,
    feedbackController.toggleLike.bind(feedbackController));

  // Comment routes
  router.get(
    '/:feedbackId/comments',
    optionalAuthenticate,
    feedbackController.getCommentsByFeedback.bind(feedbackController));

  router.get(
    '/:feedbackId/comments/count',
    optionalAuthenticate,
    feedbackController.getCommentCount.bind(feedbackController));

  router.post(
    '/:feedbackId/comments',
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
    feedbackController.createComment.bind(feedbackController)
  );

  return router;
};

export default feedbackRouter;


