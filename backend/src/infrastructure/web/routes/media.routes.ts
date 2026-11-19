// backend/src/infrastructure/web/routes/media.routes.ts
import { Router } from 'express';
import { MediaController } from '../controllers/media.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';

const mediaRouter = (mediaController: MediaController): Router => {
  const router = Router();

  // Access is checked here (cookies, same rules as the lesson page)...
  router.get('/lessons/:lessonId/stream', optionalAuthenticate, mediaController.stream);
  // ...and these two only accept the 2-minute token that /stream hands out.
  router.get('/lessons/:lessonId/playlist.m3u8', mediaController.playlist);
  router.get('/lessons/:lessonId/key', mediaController.key);

  return router;
};

export default mediaRouter;
