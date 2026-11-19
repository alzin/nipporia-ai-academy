// backend/src/infrastructure/web/controllers/profile.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { GetMyProfileUseCase } from '../../../application/use-cases/profile/GetMyProfileUseCase';
import { UpdateProfileUseCase } from '../../../application/use-cases/profile/UpdateProfileUseCase';

export class ProfileController {
  constructor(
    private getMyProfileUseCase: GetMyProfileUseCase,
    private updateProfileUseCase: UpdateProfileUseCase
  ) { }

  async getMyProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await this.getMyProfileUseCase.execute({
        userId: req.user!.userId
      });

      res.json(profile);
    } catch (error) {
      if (error instanceof Error && error.message === 'Profile not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.body;

      const updatedProfile = await this.updateProfileUseCase.execute({
        userId: req.user!.userId,
        name
      });

      res.json(updatedProfile);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Profile not found') {
          res.status(404).json({ error: error.message });
          return;
        }
        if (error.message === 'Name must be a non-empty string') {
          res.status(400).json({ error: error.message });
          return;
        }
      }
      next(error);
    }
  }
}
