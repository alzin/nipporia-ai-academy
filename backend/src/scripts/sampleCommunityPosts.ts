// Adds (or removes) the labeled example threads in the community 「投稿」 tab.
// Every row it writes is marked: posts.isSample / comment.isSample = true (the UI shows
// a 「サンプル投稿」 badge), and the authors are sample accounts named 「受講者A（例）」 etc.
//
// Usage (from backend/):
//   npm run sample-posts -- seed     add or update the samples (safe to re-run)
//   npm run sample-posts -- status   show what is there
//   npm run sample-posts -- remove   delete only the sample rows and their images
//
// The database is DATABASE_URL (backend/.env points at the Neon dev branch; set it in
// the environment to target production). Run the AddSampleFlags migration first.
//
// Sample accounts can't be used: inactive, not verified, a password field that is not a
// bcrypt hash (so no password matches), and @example.com addresses (reserved, no mail).
import 'reflect-metadata';
import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';
import { AppDataSource } from '../infrastructure/database/config/database.config';
import { ENV_CONFIG } from '../infrastructure/config/env.config';
import { SAMPLE_AUTHORS, SAMPLE_THREADS } from './sampleCommunityPosts.data';

const USER_PREFIX = 'sample-user-';
const POST_PREFIX = 'sample-post-';
const COMMENT_PREFIX = 'sample-comment-';
const LIKE_PREFIX = 'sample-like-';
const MEDIA_DIR = path.join(__dirname, 'sample-media');
const MEDIA_KEY_PREFIX = 'community/sample-posts/';
const DISABLED_PASSWORD = '!sample-account: login disabled (not a bcrypt hash)';
const ACCOUNTS_CREATED_JST = '2026-10-20 10:00';

const userId = (key: string) => `${USER_PREFIX}${key}`;
const emailOf = (key: string) => `sample-${key}@example.com`;

/** 'YYYY-MM-DD HH:MM' in Japan time → UTC 'YYYY-MM-DD HH:MM:SS' (columns are timestamp without time zone, read as UTC). */
function jstToUtc(jst: string): string {
  const d = new Date(`${jst.replace(' ', 'T')}:00+09:00`);
  if (Number.isNaN(d.getTime())) throw new Error(`Bad time: ${jst}`);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

const bucket = ENV_CONFIG.AWS_S3_BUCKET_NAME || '';
const region = ENV_CONFIG.AWS_REGION || 'ap-northeast-1';
const s3 = new AWS.S3({
  accessKeyId: ENV_CONFIG.AWS_ACCESS_KEY_ID,
  secretAccessKey: ENV_CONFIG.AWS_SECRET_ACCESS_KEY,
  region,
  signatureVersion: 'v4',
});
const mediaUrl = (file: string) => `https://${bucket}.s3.${region}.amazonaws.com/${MEDIA_KEY_PREFIX}${file}`;

async function uploadMedia(files: string[]): Promise<void> {
  if (!bucket) throw new Error('AWS_S3_BUCKET_NAME is not set');
  for (const file of files) {
    const body = fs.readFileSync(path.join(MEDIA_DIR, file));
    // Same settings as community uploads; overwriting keeps the file in line with the repo.
    await s3.putObject({
      Bucket: bucket,
      Key: `${MEDIA_KEY_PREFIX}${file}`,
      Body: body,
      ContentType: file.endsWith('.png') ? 'image/png' : file.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream',
      ContentDisposition: `inline; filename="${file}"`,
      CacheControl: 'public, max-age=31536000',
    }).promise();
    console.log(`  uploaded ${MEDIA_KEY_PREFIX}${file}`);
  }
}

function checkData(): void {
  const authorKeys = new Set(SAMPLE_AUTHORS.map((a) => a.key));
  for (const a of SAMPLE_AUTHORS) {
    if (!a.name.endsWith('（例）')) throw new Error(`Sample name must end in （例）: ${a.name}`);
  }
  for (const t of SAMPLE_THREADS) {
    if (!authorKeys.has(t.author)) throw new Error(`Unknown author ${t.author} in ${t.key}`);
    t.likedBy.forEach((k) => { if (!authorKeys.has(k)) throw new Error(`Unknown liker ${k} in ${t.key}`); });
    t.comments.forEach((c, i) => {
      if (!authorKeys.has(c.author)) throw new Error(`Unknown author ${c.author} in ${t.key}/${i}`);
      if (i > 0 && jstToUtc(c.at) <= jstToUtc(t.comments[i - 1].at)) throw new Error(`Comments out of order in ${t.key}/${i}`);
      if (jstToUtc(c.at) <= jstToUtc(t.at)) throw new Error(`Comment before post in ${t.key}/${i}`);
    });
    if (t.comments[0]?.author !== 'teacher') throw new Error(`First comment of ${t.key} must be the teacher's answer`);
    (t.media || []).forEach((f) => {
      if (!fs.existsSync(path.join(MEDIA_DIR, f))) throw new Error(`Missing media file ${f}`);
    });
  }
}

async function refuseCollisions(): Promise<void> {
  // Never take over a real row: the fixed sample ids/emails must be free or already sample rows.
  const emails = SAMPLE_AUTHORS.map((a) => emailOf(a.key));
  const ids = SAMPLE_AUTHORS.map((a) => userId(a.key));
  const clash = await AppDataSource.query(
    `SELECT id FROM users WHERE (email = ANY($1) AND id <> ALL($2)) OR (id = ANY($2) AND email <> ALL($1))`,
    [emails, ids],
  );
  if (clash.length) throw new Error(`Refusing: ${clash.length} existing user(s) use a sample id or email`);
  const realPosts = await AppDataSource.query(
    `SELECT id FROM posts WHERE id LIKE $1 AND "isSample" = false`, [`${POST_PREFIX}%`]);
  const realComments = await AppDataSource.query(
    `SELECT id FROM comment WHERE id LIKE $1 AND "isSample" = false`, [`${COMMENT_PREFIX}%`]);
  if (realPosts.length || realComments.length) throw new Error('Refusing: a non-sample row uses a sample id');
}

async function seed(): Promise<void> {
  checkData();
  await refuseCollisions();
  const media = Array.from(new Set(SAMPLE_THREADS.flatMap((t) => t.media || [])));
  if (media.length) await uploadMedia(media);

  await AppDataSource.transaction(async (m) => {
    const accountsAt = jstToUtc(ACCOUNTS_CREATED_JST);
    for (const a of SAMPLE_AUTHORS) {
      await m.query(
        `INSERT INTO users (id, email, password, role, "isActive", isverify, "marketingEmails", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, 'STUDENT', false, false, false, $4, $4)
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password = EXCLUDED.password,
           "isActive" = false, isverify = false, "marketingEmails" = false, "verificationCode" = NULL`,
        [userId(a.key), emailOf(a.key), DISABLED_PASSWORD, accountsAt],
      );
      await m.query(
        `INSERT INTO profiles (id, "userId", name, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $4)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
        [`sample-profile-${a.key}`, userId(a.key), a.name, accountsAt],
      );
    }

    const postIds: string[] = [];
    const commentIds: string[] = [];
    const likeIds: string[] = [];
    for (const t of SAMPLE_THREADS) {
      const postId = `${POST_PREFIX}${t.key}`;
      postIds.push(postId);
      const at = jstToUtc(t.at);
      await m.query(
        `INSERT INTO posts (id, "userId", content, "mediaUrls", "likesCount", "isSample", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, 0, true, $5, $5)
         ON CONFLICT (id) DO UPDATE SET "userId" = EXCLUDED."userId", content = EXCLUDED.content,
           "mediaUrls" = EXCLUDED."mediaUrls", "isSample" = true, "createdAt" = EXCLUDED."createdAt", "updatedAt" = EXCLUDED."updatedAt"`,
        [postId, userId(t.author), t.text, (t.media || []).map(mediaUrl).join(','), at],
      );

      for (let i = 0; i < t.comments.length; i++) {
        const c = t.comments[i];
        const id = `${COMMENT_PREFIX}${t.key}-${i + 1}`;
        // Everything after the answer is a reply to it, so the thread reads top to bottom.
        const parent = i === 0 ? null : `${COMMENT_PREFIX}${t.key}-1`;
        commentIds.push(id);
        await m.query(
          `INSERT INTO comment (id, "postId", "userId", content, "parentCommentId", "isSample", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, true, $6, $6)
           ON CONFLICT (id) DO UPDATE SET "postId" = EXCLUDED."postId", "userId" = EXCLUDED."userId",
             content = EXCLUDED.content, "parentCommentId" = EXCLUDED."parentCommentId", "isSample" = true,
             "createdAt" = EXCLUDED."createdAt", "updatedAt" = EXCLUDED."updatedAt"`,
          [id, postId, userId(c.author), c.text, parent, jstToUtc(c.at)],
        );
      }

      for (const k of t.likedBy) {
        const id = `${LIKE_PREFIX}${t.key}-${k}`;
        likeIds.push(id);
        await m.query(
          `INSERT INTO post_likes (id, "userId", "postId", "createdAt") VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [id, userId(k), postId, at],
        );
      }
    }

    // Rows from an older version of the data that are gone now (sample rows only).
    await m.query(`DELETE FROM comment WHERE "isSample" = true AND id LIKE $1 AND id <> ALL($2)`, [`${COMMENT_PREFIX}%`, commentIds]);
    await m.query(`DELETE FROM post_likes WHERE id LIKE $1 AND id <> ALL($2)`, [`${LIKE_PREFIX}%`, likeIds]);
    // Count = sample likes + any likes real members added.
    await m.query(
      `UPDATE posts p SET "likesCount" = (SELECT COUNT(*) FROM post_likes l WHERE l."postId" = p.id) WHERE p.id = ANY($1)`,
      [postIds],
    );
  });
  console.log(`Seeded ${SAMPLE_THREADS.length} sample threads.`);
  await status();
}

async function remove(): Promise<void> {
  const ids = SAMPLE_AUTHORS.map((a) => userId(a.key));
  await AppDataSource.transaction(async (m) => {
    const posts: { id: string }[] = await m.query(`SELECT id FROM posts WHERE "isSample" = true`);
    const postIds = posts.map((p) => p.id);
    // Comments have no foreign key to posts, so remove every comment on a sample post
    // (including any a real member wrote there), then the sample comments themselves.
    const c = await m.query(`DELETE FROM comment WHERE "postId" = ANY($1) OR "isSample" = true`, [postIds]);
    const l = await m.query(`DELETE FROM post_likes WHERE "postId" = ANY($1) OR id LIKE $2`, [postIds, `${LIKE_PREFIX}%`]);
    const p = await m.query(`DELETE FROM posts WHERE "isSample" = true`);
    await m.query(`DELETE FROM profiles WHERE "userId" = ANY($1)`, [ids]);
    const u = await m.query(`DELETE FROM users WHERE id = ANY($1) AND email LIKE '%@example.com'`, [ids]);
    console.log(`Removed posts ${p[1]}, comments ${c[1]}, likes ${l[1]}, sample accounts ${u[1]}.`);
  });
  const media = Array.from(new Set(SAMPLE_THREADS.flatMap((t) => t.media || [])));
  for (const file of media) {
    await s3.deleteObject({ Bucket: bucket, Key: `${MEDIA_KEY_PREFIX}${file}` }).promise();
    console.log(`  deleted ${MEDIA_KEY_PREFIX}${file}`);
  }
}

async function status(): Promise<void> {
  const [row] = await AppDataSource.query(
    `SELECT
       (SELECT COUNT(*) FROM posts WHERE "isSample") AS sample_posts,
       (SELECT COUNT(*) FROM comment WHERE "isSample") AS sample_comments,
       (SELECT COUNT(*) FROM post_likes l JOIN posts p ON p.id = l."postId" WHERE p."isSample") AS likes_on_samples,
       (SELECT COUNT(*) FROM users WHERE id LIKE $1) AS sample_accounts,
       (SELECT COUNT(*) FROM users WHERE id LIKE $1 AND ("isActive" OR isverify)) AS usable_sample_accounts,
       (SELECT COUNT(*) FROM posts WHERE NOT "isSample") AS real_posts`,
    [`${USER_PREFIX}%`],
  );
  console.log(row);
}

async function main(): Promise<void> {
  const cmd = process.argv[2];
  if (!['seed', 'remove', 'status'].includes(cmd)) {
    console.log('Usage: npm run sample-posts -- seed|status|remove');
    process.exit(1);
  }
  await AppDataSource.initialize();
  try {
    if (cmd === 'seed') await seed();
    else if (cmd === 'remove') await remove();
    else await status();
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
