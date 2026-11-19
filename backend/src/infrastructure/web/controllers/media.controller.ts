// backend/src/infrastructure/web/controllers/media.controller.ts
// Serves lesson videos as encrypted HLS. See LessonMediaService for the design.
//
//   GET /api/media/lessons/:lessonId/stream          (cookie auth, same rules as the lesson page)
//       -> { type: 'hls', url: <playlist link with a 2-minute token> }
//   GET /api/media/lessons/:lessonId/playlist.m3u8?t  (token) -> playlist, segments presigned
//   GET /api/media/lessons/:lessonId/key?t            (token) -> 16-byte AES key
import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { LessonRepository } from '../../database/repositories/LessonRepository';
import { CourseRepository } from '../../database/repositories/CourseRepository';
import { LessonAccessService, isLessonLocked } from '../../../application/services/LessonAccessService';
import { LessonMediaService } from '../../services/LessonMediaService';
import { ENV_CONFIG } from '../../config/env.config';

const NO_STORE = 'private, no-store, max-age=0';

export class MediaController {
  constructor(
    private lessonRepository: LessonRepository,
    private courseRepository: CourseRepository,
    private lessonAccess: LessonAccessService,
    private media: LessonMediaService,
  ) { }

  /** Absolute base of this API, e.g. http://localhost:5000/api */
  private apiBase(req: Request): string {
    if (ENV_CONFIG.API_URL) return ENV_CONFIG.API_URL.replace(/\/+$/, '');
    return `${req.protocol}://${req.get('host')}/api`;
  }

  private headers(res: Response): void {
    res.setHeader('Cache-Control', NO_STORE);
    // Native HLS players (iOS Safari) load these without CORS.
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }

  stream = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { lessonId } = req.params;
      const lesson = await this.lessonRepository.findById(lessonId);
      if (!lesson) {
        res.status(404).json({ error: 'Lesson not found' });
        return;
      }
      const role = req.user?.role;
      const course = await this.courseRepository.findById(lesson.courseId);
      if (!course || (!course.isActive && role !== 'ADMIN')) {
        res.status(404).json({ error: 'Lesson not found' });
        return;
      }
      const hasFullAccess = await this.lessonAccess.hasFullAccess({ userId: req.user?.userId, role });
      if (isLessonLocked(lesson, course, hasFullAccess)) {
        res.status(403).json({ error: 'SUBSCRIPTION_REQUIRED' });
        return;
      }

      const sourceKey = this.media.sourceKey(lesson.contentUrl);
      if (!sourceKey) {
        res.status(404).json({ error: 'No protected video for this lesson' });
        return;
      }

      this.headers(res);
      if (await this.media.hasHls(sourceKey)) {
        const token = this.media.signToken(lessonId, req.user?.userId);
        res.json({
          type: 'hls',
          url: `${this.apiBase(req)}/media/lessons/${encodeURIComponent(lessonId)}/playlist.m3u8?t=${encodeURIComponent(token)}`,
        });
        return;
      }

      // Not converted yet (for example a video an admin just uploaded): short-lived MP4 link.
      // Sent with res.send so the response signer does not swap in its 6-hour link.
      console.warn(`[media] lesson ${lessonId} has no HLS version yet; run "npm run video:hls".`);
      res.type('application/json').send(JSON.stringify({ type: 'mp4', url: this.media.fallbackMp4Url(sourceKey) }));
    } catch (error) {
      next(error);
    }
  };

  playlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { lessonId } = req.params;
      const token = this.media.verifyToken(req.query.t as string | undefined, lessonId);
      if (!token) {
        res.status(403).type('text/plain').send('Link expired');
        return;
      }
      const lesson = await this.lessonRepository.findById(lessonId);
      const sourceKey = this.media.sourceKey(lesson?.contentUrl);
      if (!lesson || !sourceKey) {
        res.status(404).type('text/plain').send('Not found');
        return;
      }
      const keyToken = this.media.signToken(lessonId, token.u);
      const keyUrl = `${this.apiBase(req)}/media/lessons/${encodeURIComponent(lessonId)}/key?t=${encodeURIComponent(keyToken)}`;
      const playlist = await this.media.buildPlaylist(sourceKey, keyUrl);
      if (!playlist) {
        res.status(404).type('text/plain').send('Not found');
        return;
      }
      this.headers(res);
      res.type('application/vnd.apple.mpegurl').send(playlist);
    } catch (error) {
      next(error);
    }
  };

  key = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { lessonId } = req.params;
      if (!this.media.verifyToken(req.query.t as string | undefined, lessonId)) {
        res.status(403).type('text/plain').send('Link expired');
        return;
      }
      const lesson = await this.lessonRepository.findById(lessonId);
      const sourceKey = this.media.sourceKey(lesson?.contentUrl);
      const key = sourceKey ? await this.media.getKey(sourceKey) : null;
      if (!key) {
        res.status(404).type('text/plain').send('Not found');
        return;
      }
      this.headers(res);
      res.type('application/octet-stream').send(key);
    } catch (error) {
      next(error);
    }
  };
}
