// The S3 bucket is private. The database stores plain object URLs
// (https://<bucket>.s3.<region>.amazonaws.com/<key>). On the way out, every such
// URL found in a JSON response is replaced with a short-lived presigned GET URL.
// On the way in, presigned query strings are stripped so the database never
// stores temporary links (for example when an admin saves a lesson form).
//
// Access control happens before this point: locked lessons never include their
// content URLs, so only content the server already decided to return gets signed.
import { NextFunction, Request, Response } from 'express';
import AWS from 'aws-sdk';
import { ENV_CONFIG } from '../../config/env.config';

const SIGNED_URL_TTL_SECONDS = 6 * 60 * 60; // long enough to finish a video

const bucket = ENV_CONFIG.AWS_S3_BUCKET_NAME || '';
const region = ENV_CONFIG.AWS_REGION || 'ap-northeast-1';

const s3 = new AWS.S3({
  accessKeyId: ENV_CONFIG.AWS_ACCESS_KEY_ID,
  secretAccessKey: ENV_CONFIG.AWS_SECRET_ACCESS_KEY,
  region,
  signatureVersion: 'v4',
});

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Virtual-hosted (with or without region) and path-style URLs for our bucket only.
const BUCKET_URL_RE = bucket
  ? new RegExp(
    `https://(?:${escapeRegExp(bucket)}\\.s3(?:[.-]${escapeRegExp(region)})?\\.amazonaws\\.com/` +
    `|s3(?:[.-]${escapeRegExp(region)})?\\.amazonaws\\.com/${escapeRegExp(bucket)}/)` +
    `([^\\s"'<>?#]+)(\\?[^\\s"'<>#]*)?`,
    'g'
  )
  : null;

function plainUrl(key: string): string {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

function keyFromPath(encodedKey: string): string {
  try {
    return decodeURIComponent(encodedKey);
  } catch {
    return encodedKey;
  }
}

function presign(encodedKey: string): string {
  return s3.getSignedUrl('getObject', {
    Bucket: bucket,
    Key: keyFromPath(encodedKey),
    Expires: SIGNED_URL_TTL_SECONDS,
  });
}

function mapStrings(value: any, fn: (s: string) => string, seen = new WeakSet<object>()): any {
  if (typeof value === 'string') return fn(value);
  if (!value || typeof value !== 'object') return value;
  if (Buffer.isBuffer(value) || value instanceof Date) return value;
  if (seen.has(value)) return value;
  seen.add(value);

  if (Array.isArray(value)) return value.map((v) => mapStrings(v, fn, seen));

  const source = typeof value.toJSON === 'function' ? value.toJSON() : value;
  if (source !== value) return mapStrings(source, fn, seen);

  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(value)) out[k] = mapStrings(v, fn, seen);
  return out;
}

export function signBucketUrls(text: string): string {
  if (!BUCKET_URL_RE || !text.includes('amazonaws.com')) return text;
  return text.replace(BUCKET_URL_RE, (_m, key: string) => presign(key));
}

export function stripBucketSignatures(text: string): string {
  if (!BUCKET_URL_RE || !text.includes('amazonaws.com')) return text;
  return text.replace(BUCKET_URL_RE, (_m, key: string) => plainUrl(key));
}

/** Replace bucket URLs in JSON responses with presigned GET URLs. */
export const signS3UrlsInResponse = (_req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json.bind(res);
  res.json = (body?: any) => originalJson(mapStrings(body, signBucketUrls));
  next();
};

/** Remove presigned query strings from bucket URLs in incoming JSON bodies. */
export const stripS3SignaturesInRequest = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    req.body = mapStrings(req.body, stripBucketSignatures);
  }
  next();
};
