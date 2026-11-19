// Converts lesson videos stored in the bucket into AES-128 encrypted HLS
// (hls/<source key without extension>/index.m3u8, seg_NNN.ts, key.bin, meta.json).
// The player only ever gets the encrypted version; see LessonMediaService.
//
// Usage: npm run video:hls                 converts videos that are new or changed
//        npm run video:hls -- --force      converts everything again (new keys)
//        npm run video:hls -- --lesson <id>
// Needs ffmpeg on PATH (or FFMPEG_PATH).
import 'reflect-metadata';
import 'dotenv/config';
import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import AWS from 'aws-sdk';
import { AppDataSource } from '../infrastructure/database/config/database.config';
import { LessonMediaService } from '../infrastructure/services/LessonMediaService';

const bucket = process.env.AWS_S3_BUCKET_NAME || '';
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-northeast-1',
  signatureVersion: 'v4',
});
const media = new LessonMediaService();
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';

const args = process.argv.slice(2);
const force = args.includes('--force');
const onlyLesson = args.includes('--lesson') ? args[args.indexOf('--lesson') + 1] : undefined;

function run(cmd: string, cmdArgs: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, cmdArgs, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => { err = (err + d.toString()).slice(-4000); });
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}: ${err}`))));
  });
}

async function readMeta(prefix: string): Promise<{ sourceETag?: string } | null> {
  try {
    const res = await s3.getObject({ Bucket: bucket, Key: `${prefix}meta.json` }).promise();
    return JSON.parse((res.Body as Buffer).toString('utf8'));
  } catch {
    return null;
  }
}

async function convert(lessonId: string, title: string, sourceKey: string): Promise<'converted' | 'skipped'> {
  const prefix = media.hlsPrefix(sourceKey);
  const head = await s3.headObject({ Bucket: bucket, Key: sourceKey }).promise();
  const meta = await readMeta(prefix);
  if (!force && meta?.sourceETag && meta.sourceETag === head.ETag) return 'skipped';

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nipporia-hls-'));
  try {
    const src = path.join(dir, 'source.mp4');
    const body = await s3.getObject({ Bucket: bucket, Key: sourceKey }).promise();
    fs.writeFileSync(src, body.Body as Buffer);

    const keyFile = path.join(dir, 'key.bin');
    fs.writeFileSync(keyFile, crypto.randomBytes(16));
    const keyInfo = path.join(dir, 'keyinfo.txt');
    // Line 1: key URI written into the playlist (the API replaces it with a signed link).
    fs.writeFileSync(keyInfo, `key\n${keyFile}\n${crypto.randomBytes(16).toString('hex')}\n`);

    const out = path.join(dir, 'out');
    fs.mkdirSync(out);
    await run(ffmpeg, [
      '-y', '-loglevel', 'error', '-i', src,
      '-map', '0:v:0', '-map', '0:a:0?',
      '-c', 'copy',
      '-f', 'hls', '-hls_time', '6', '-hls_playlist_type', 'vod',
      '-hls_key_info_file', keyInfo,
      '-hls_segment_filename', path.join(out, 'seg_%03d.ts'),
      path.join(out, 'index.m3u8'),
    ]);

    const segments = fs.readdirSync(out).filter((f) => f.endsWith('.ts')).sort();
    for (const seg of segments) {
      await s3.putObject({
        Bucket: bucket, Key: `${prefix}${seg}`, Body: fs.readFileSync(path.join(out, seg)),
        ContentType: 'video/mp2t', CacheControl: 'private, max-age=86400',
      }).promise();
    }
    // Key and playlist last, so a half-finished upload never pairs a new key with old segments.
    await s3.putObject({ Bucket: bucket, Key: `${prefix}key.bin`, Body: fs.readFileSync(keyFile), ContentType: 'application/octet-stream', CacheControl: 'no-store' }).promise();
    await s3.putObject({ Bucket: bucket, Key: `${prefix}index.m3u8`, Body: fs.readFileSync(path.join(out, 'index.m3u8')), ContentType: 'application/vnd.apple.mpegurl', CacheControl: 'no-store' }).promise();
    await s3.putObject({
      Bucket: bucket, Key: `${prefix}meta.json`, ContentType: 'application/json',
      Body: JSON.stringify({ lessonId, title, sourceKey, sourceETag: head.ETag, segments: segments.length, convertedAt: new Date().toISOString() }),
    }).promise();
    return 'converted';
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function main() {
  if (!bucket) throw new Error('AWS_S3_BUCKET_NAME is not set');
  await AppDataSource.initialize();
  const rows: { id: string; title: string; contentUrl: string }[] = await AppDataSource.query(
    `SELECT id, title, "contentUrl" FROM lessons WHERE "lessonType" = 'VIDEO' AND "contentUrl" IS NOT NULL ORDER BY "courseId", "order"`
  );
  await AppDataSource.destroy();

  let converted = 0;
  for (const row of rows) {
    if (onlyLesson && row.id !== onlyLesson) continue;
    const sourceKey = media.sourceKey(row.contentUrl);
    if (!sourceKey) continue; // YouTube or another host
    const result = await convert(row.id, row.title, sourceKey);
    if (result === 'converted') converted++;
    console.log(`${result.padEnd(9)} ${sourceKey}  (${row.title})`);
  }
  console.log(`Done: ${converted} converted.`);
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
