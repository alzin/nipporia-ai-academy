import express, { Application } from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';
import { signS3UrlsInResponse, stripS3SignaturesInRequest } from './middleware/s3Urls.middleware';

import authRouter from './routes/auth.routes';
import courseRouter from './routes/course.routes';
import communityRouter from './routes/community.routes';
import adminRouter from './routes/admin.routes';
import profileRouter from './routes/profile.routes';
import paymentRouter from './routes/payment.routes';
import subscriptionRouter from './routes/subscription.routes';
import dashboardRouter from './routes/dashboard.routes';
import feedbackRouter from './routes/feedback.routes';
import activityRouter from './routes/activity.routes';
import announcementRouter from './routes/announcement.routes';
import videoRouter from './routes/video.routes';
import mediaRouter from './routes/media.routes';

import { setupDependencies, DependencyContainer } from './dependencies';
import { setupSwagger } from './swagger/swagger.setup';
import { ENV_CONFIG } from '../config/env.config';

export class Server {
  private app: Application;
  private port: number;
  private dependencies: DependencyContainer;


  constructor(port: number) {
    this.app = express();
    this.port = port;
    this.dependencies = setupDependencies();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureSwagger();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    // Cloud Run sits behind one Google front end: trust it for req.ip / secure cookies.
    this.app.set('trust proxy', 1);

    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // 'unsafe-inline' only for the small Google tag and Clarity snippets in index.html.
          // Google tag hosts: GA4 + Google Ads conversion tracking. Clarity: heatmaps/recordings.
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://accounts.google.com/gsi/client', 'https://js.stripe.com', 'https://www.googletagmanager.com', 'https://www.googleadservices.com', 'https://googleads.g.doubleclick.net', 'https://www.google.com', 'https://www.clarity.ms', 'https://*.clarity.ms'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://accounts.google.com/gsi/style'],
          fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          // Lesson videos: encrypted HLS pieces from S3, played through blob: URLs.
          mediaSrc: ["'self'", 'blob:', 'https://*.amazonaws.com'],
          connectSrc: ["'self'", 'https://*.amazonaws.com', 'https://accounts.google.com/gsi/', 'https://api.stripe.com', 'https://*.google-analytics.com', 'https://analytics.google.com', 'https://*.analytics.google.com', 'https://www.googletagmanager.com', 'https://www.google.com', 'https://google.com', 'https://googleads.g.doubleclick.net', 'https://stats.g.doubleclick.net', 'https://ad.doubleclick.net', 'https://www.googleadservices.com', 'https://pagead2.googlesyndication.com', 'https://*.clarity.ms'],
          frameSrc: ["'self'", 'https://accounts.google.com/gsi/', 'https://js.stripe.com', 'https://hooks.stripe.com', 'https://www.youtube.com', 'https://www.youtube-nocookie.com', 'https://www.googletagmanager.com', 'https://td.doubleclick.net', 'https://bid.g.doubleclick.net'],
          workerSrc: ["'self'", 'blob:'],
          objectSrc: ["'none'"],
        },
      },
      // Google sign-in opens a popup that must be able to report back.
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    }));

    this.app.use(cors({
      origin: ENV_CONFIG.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    }));

    this.app.use(compression());
    this.app.use(morgan('dev'));
    this.app.use(cookieParser());

    this.app.use((req, res, next) => {
      if (req.originalUrl === "/api/payment/webhook") {
        next();
      } else {
        express.json({ limit: '10mb' })(req, res, next); // Increased limit for file uploads
      }
    });

    // Private bucket: sign S3 URLs on the way out, strip signatures on the way in.
    this.app.use('/api', stripS3SignaturesInRequest, signS3UrlsInResponse);
  }

  private configureRoutes(): void {

    // API routes
    this.app.use('/api/auth', authRouter(this.dependencies.controllers.auth));
    this.app.use('/api/profile', profileRouter(this.dependencies.controllers.profile));
    this.app.use('/api/courses', courseRouter(this.dependencies.controllers.course));
    this.app.use('/api/community', communityRouter(this.dependencies.controllers.community));
    this.app.use('/api/payment', paymentRouter(this.dependencies.controllers.payment));
    this.app.use('/api/admin', adminRouter(this.dependencies.controllers.admin));
    this.app.use('/api/subscriptions', subscriptionRouter(this.dependencies.controllers.subscription));
    this.app.use('/api/dashboard', dashboardRouter(this.dependencies.controllers.dashboard));
    this.app.use('/api/activities', activityRouter(this.dependencies.controllers.activity));
    this.app.use('/api/announcements', announcementRouter(this.dependencies.controllers.announcement));
    this.app.use('/api/videos', videoRouter(this.dependencies.controllers.video));
    this.app.use('/api/media', mediaRouter(this.dependencies.controllers.media));
    this.app.use('/api/feedback', feedbackRouter(this.dependencies.controllers.feedback));

    // Health check
    this.app.get('/api/health', (_, res) => {
      res.send('OK');
    });

    // Production: the built React app is served from the same origin as the API
    // (frontend/build copied to ./public in the Docker image).
    const webRoot = path.resolve(process.env.WEB_ROOT || path.join(__dirname, '../../../public'));
    if (fs.existsSync(path.join(webRoot, 'index.html'))) {
      this.app.use(express.static(webRoot, {
        index: false,
        setHeaders: (res, filePath) => {
          // Hashed build files never change; everything else is revalidated.
          res.setHeader('Cache-Control', filePath.includes(`${path.sep}static${path.sep}`)
            ? 'public, max-age=31536000, immutable'
            : 'no-cache');
        },
      }));
      this.app.use('/api', (_req, res) => {
        res.status(404).json({ error: 'Not found' });
      });
      // Landing pages (static HTML, landing/<name>/ in the repo).
      const landing = path.join(webRoot, 'claude-code');
      if (fs.existsSync(path.join(landing, 'index.html'))) {
        this.app.use('/claude-code', express.static(landing, {
          setHeaders: (res, filePath) => {
            res.setHeader('Cache-Control', filePath.endsWith('.html') ? 'no-cache' : 'public, max-age=86400');
          },
        }));
        // The bare domain opens the course landing page; the app itself lives under /dashboard, /classroom ...
        this.app.get('/', (_req, res) => res.redirect(302, '/claude-code/'));
      }
      this.app.get(/.*/, (_req, res) => {
        res.setHeader('Cache-Control', 'no-cache');
        res.sendFile(path.join(webRoot, 'index.html'));
      });
    } else {
      this.app.get('/', (_, res) => {
        res.send('OK');
      });
    }
  }

  private configureErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private configureSwagger(): void {
    if (ENV_CONFIG.NODE_ENV === 'production') return;
    setupSwagger(this.app);
  }

  public async start(): Promise<void> {
    this.app.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
      console.log(`API Documentation available at http://localhost:${this.port}/docs`);

      // Log S3 configuration status
      if (ENV_CONFIG.AWS_ACCESS_KEY_ID && ENV_CONFIG.AWS_SECRET_ACCESS_KEY) {
        console.log(`✅ AWS S3 configured for bucket: ${ENV_CONFIG.AWS_S3_BUCKET_NAME}`);
      } else {
        console.log(`⚠️  AWS S3 not configured - using local storage`);
      }
    });
  }

  public getApp(): Application {
    return this.app;
  }
}