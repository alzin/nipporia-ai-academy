// backend/src/infrastructure/web/routes/dashboard.routes.ts
import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';

const dashboardRouter = (dashboardController: DashboardController): Router => {
    const router = Router();

    // Guests get the course list with empty progress
    router.use(optionalAuthenticate);

    router.get('/', dashboardController.getDashboardData.bind(dashboardController));
    router.get('/data', dashboardController.getDashboardData.bind(dashboardController));

    return router;
};

export default dashboardRouter;
