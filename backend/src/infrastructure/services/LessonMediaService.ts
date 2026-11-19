// Protected lesson video delivery.
//
// Lesson videos are never handed to viewers as a plain or presigned MP4 link.
// Each video is converted ahead of time (npm run video:hls) into HLS: short
// AES-128 encrypted segments plus a playlist, stored next to a random key under
//   hls/<source key without extension>/index.m3u8, seg_000.ts ..., key.bin
// The bucket is private. The API serves the playlist and the key only to viewers
// who may watch the lesson, through short-lived signed tokens. Segments are
// presigned S3 links, but they are encrypted, so a leaked segment link is useless.
import AWS from 'aws-sdk';
import jwt from 'jsonwebtoken';
import { ENV_CONFIG } from '../config/env.config';

/** How long the playlist / key links from /stream stay valid. Only needed at load time. */
export const MEDIA_TOKEN_TTL_SECONDS = 120;
/** Encrypted segments: long enough to pause and resume a lesson. */
const SEGMENT_URL_TTL_SECONDS = 2 * 60 * 60;
/** Fallback MP4 link for videos that are not converted yet. */
const FALLBACK_MP4_TTL_SECONDS = 15 * 60;

// Short, so a re-converted video (new key, new segments) is picked up within a minute.
const CACHE_TTL_MS = 60 * 1000;

interface MediaTokenPayload {
  typ: 'media';
  l: string; // lessonId
  u?: string; // userId (for logs)
}

/** True when the URL points at a file in our private bucket (served only through /api/media). */
export function isBucketVideoUrl(contentUrl?: string | null): boolean {
  return defaultMediaService().isProtectedVideo(contentUrl);
}

let shared: LessonMediaService | null = null;
function defaultMediaService(): LessonMediaService {
  if (!shared) shared = new LessonMediaService();
  return shared;
}

export class LessonMediaService {
  private s3: AWS.S3;
  private bucket: string;
  private region: string;
  private secret: string;
  private cache = new Map<string, { value: Buffer | string | null; at: number }>();

  constructor() {
    this.bucket = ENV_CONFIG.AWS_S3_BUCKET_NAME || '';
    this.region = ENV_CONFIG.AWS_REGION || 'ap-northeast-1';
    this.secret = `${ENV_CONFIG.JWT_SECRET || ''}:media`;
    this.s3 = new AWS.S3({
      accessKeyId: ENV_CONFIG.AWS_ACCESS_KEY_ID,
      secretAccessKey: ENV_CONFIG.AWS_SECRET_ACCESS_KEY,
      region: this.region,
      signatureVersion: 'v4',
    });
  }

  /** S3 key of a video stored in our bucket, or null (YouTube, other hosts, empty). */
  sourceKey(contentUrl?: string | null): string | null {
    if (!contentUrl || !this.bucket) return null;
    let url: URL;
    try {
      url = new URL(contentUrl);
    } catch {
      return null;
    }
    const host = url.hostname;
    let path = url.pathname.replace(/^\/+/, '');
    const virtualHosted =
      host === `${this.bucket}.s3.amazonaws.com` ||
      host === `${this.bucket}.s3.${this.region}.amazonaws.com` ||
      host === `${this.bucket}.s3-${this.region}.amazonaws.com`;
    const pathStyle =
      (host === 's3.amazonaws.com' || host === `s3.${this.region}.amazonaws.com`) &&
      path.startsWith(`${this.bucket}/`);
    if (pathStyle) path = path.substring(this.bucket.length + 1);
    if (!virtualHosted && !pathStyle) return null;
    try {
      return decodeURIComponent(path) || null;
    } catch {
      return path || null;
    }
  }

  isProtectedVideo(contentUrl?: string | null): boolean {
    return this.sourceKey(contentUrl) !== null;
  }

  hlsPrefix(sourceKey: string): string {
    return `hls/${sourceKey.replace(/\.[^/.]+$/, '')}/`;
  }

  // ---------- tokens ----------

  signToken(lessonId: string, userId?: string): string {
    const payload: MediaTokenPayload = { typ: 'media', l: lessonId, ...(userId ? { u: userId } : {}) };
    return jwt.sign(payload, this.secret, { expiresIn: MEDIA_TOKEN_TTL_SECONDS });
  }

  verifyToken(token: string | undefined, lessonId: string): MediaTokenPayload | null {
    if (!token) return null;
    try {
      const payload = jwt.verify(token, this.secret) as MediaTokenPayload;
      return payload.typ === 'media' && payload.l === lessonId ? payload : null;
    } catch {
      return null;
    }
  }

  // ---------- S3 ----------

  private async getObject(key: string): Promise<Buffer | null> {
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value as Buffer | null;
    try {
      const res = await this.s3.getObject({ Bucket: this.bucket, Key: key }).promise();
      const body = res.Body as Buffer;
      this.cache.set(key, { value: body, at: Date.now() });
      return body;
    } catch (err: any) {
      if (err?.code === 'NoSuchKey' || err?.code === 'AccessDenied' || err?.statusCode === 404) {
        this.cache.set(key, { value: null, at: Date.now() });
        return null;
      }
      throw err;
    }
  }

  async hasHls(sourceKey: string): Promise<boolean> {
    return (await this.getObject(`${this.hlsPrefix(sourceKey)}index.m3u8`)) !== null;
  }

  async getKey(sourceKey: string): Promise<Buffer | null> {
    return this.getObject(`${this.hlsPrefix(sourceKey)}key.bin`);
  }

  /**
   * The stored playlist with every segment replaced by a presigned link and the
   * key URI replaced by our authenticated key endpoint.
   */
  async buildPlaylist(sourceKey: string, keyUrl: string): Promise<string | null> {
    const prefix = this.hlsPrefix(sourceKey);
    const template = await this.getObject(`${prefix}index.m3u8`);
    if (!template) return null;
    return template
      .toString('utf8')
      .split(/\r?\n/)
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('#EXT-X-KEY')) {
          return trimmed.replace(/URI="[^"]*"/, `URI="${keyUrl}"`);
        }
        if (!trimmed || trimmed.startsWith('#')) return line;
        return this.s3.getSignedUrl('getObject', {
          Bucket: this.bucket,
          Key: `${prefix}${trimmed}`,
          Expires: SEGMENT_URL_TTL_SECONDS,
        });
      })
      .join('\n');
  }

  /** Short-lived MP4 link, only for videos that have not been converted to HLS yet. */
  fallbackMp4Url(sourceKey: string): string {
    return this.s3.getSignedUrl('getObject', {
      Bucket: this.bucket,
      Key: sourceKey,
      Expires: FALLBACK_MP4_TTL_SECONDS,
    });
  }
}
