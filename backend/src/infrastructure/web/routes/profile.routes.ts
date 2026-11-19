// backend/src/infrastructure/web/routes/profile.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { ProfileController } from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';

const profileRouter = (profileController: ProfileController): Router => {
  const router = Router();

  router.use(authenticate);

  // Get current user's profile
  router.get('/me', profileController.getMyProfile.bind(profileController));

  // Update current user's display name
  router.put(
    '/me',
    [
      body('name')
        .exists()
        .withMessage('Name is required')
        .bail()
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Name must be between 1 and 100 characters'),
    ],
    validateRequest,
    profileController.updateProfile.bind(profileController)
  );

  return router;
};

export default profileRouter;
