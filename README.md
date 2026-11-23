# Nipporia AI Academy

Japanese video courses for AI tools, with a member community. Live at https://academy.nipporia.com. Courses: 「Claude Code 入門」 (20 short lessons), 「Claude Code を自分仕様にする」 (8 lessons) and 「コードを書かずに、自分のサイトを作って公開する」 (11 lessons).

- `frontend/` — React (CRA) + MUI + Redux Toolkit, all UI in Japanese
- `backend/` — Express + TypeORM + PostgreSQL (Neon), S3 for media, Stripe for subscriptions
- `docs/PLAN.md` — what the platform does, access rules and API contract

## Access rules

| | Guest | Logged in, no subscription | Subscriber or admin |
|---|---|---|---|
| Browse courses and lesson lists | yes | yes | yes |
| Watch a lesson | free lessons only | free lessons only | all |
| Read the community | yes | yes | yes |
| Post, comment, like | no | no | yes |

A lesson is free when `isFree` is set or `order <= course.freeLessonCount`. The server enforces this: locked lessons are returned without any content URL. The S3 bucket is private; every bucket URL in an API response is replaced with a presigned link (6 hours).

## Local setup

```bash
# backend
cd backend
cp .env.example .env        # fill in DATABASE_URL, JWT secrets, AWS keys
npm ci
npm run migration:run
npm run create-admin        # asks for email, name and password
npm run dev                 # http://localhost:5000 (API docs at /docs)

# frontend
cd frontend
cp .env.example .env.local
npm ci
npm start                   # http://localhost:3000
```

Email: with `EMAIL_HOST` set, mail goes out over SMTP (production: info@nipporia.com through Microsoft 365, `smtp.office365.com:587`); otherwise through Resend if `RESEND_API_KEY` is set; otherwise it is printed to the backend console. Without `STRIPE_SECRET_KEY` payment calls are disabled.

## Payments (Stripe)

Two plans: 月額プラン ¥4,980 and 年額プラン ¥49,800, tax included, no free trial, cancel at period end through the Stripe customer portal. Set `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_YEARLY_PRICE_ID` and optionally `STRIPE_PORTAL_CONFIGURATION_ID` in `backend/.env`.

Subscriptions are saved only from webhooks (`/api/payment/webhook`). Locally, either run `stripe listen --forward-to localhost:5000/api/payment/webhook` and put its `whsec_...` in `STRIPE_WEBHOOK_SECRET`, or, where the Stripe CLI can't run, set any random `STRIPE_WEBHOOK_SECRET` and run `npm run dev:stripe-listen` next to the backend. It polls test-mode events for this app's prices, signs them with that secret and posts them to the local webhook. It refuses live keys. Test card: `4242 4242 4242 4242`, any future date, any CVC.

In production, add a webhook endpoint in the Stripe dashboard for `checkout.session.completed`, `customer.subscription.created/updated/deleted` and `invoice.payment_succeeded/failed`, and use its signing secret.

## Protected lesson videos

Lesson videos in the S3 bucket are never sent to the browser as a file link (only admins see the link, in the edit form). They are played as AES-128 encrypted HLS:

- `GET /api/media/lessons/:id/stream` checks the viewer like the lesson page does (free lesson, member or admin) and returns a playlist link that works for 2 minutes.
- The playlist's decryption key is served by the API through another 2-minute link. The video pieces are presigned S3 links, but they are encrypted and can't be played on their own.
- The bucket stays private: the original MP4 URL returns 403.

After uploading or replacing a lesson video, run `npm run video:hls` in `backend` (needs ffmpeg). It converts new or changed videos and skips the rest; `-- --force` re-encrypts everything with new keys. Until a video is converted, the player falls back to a 15-minute MP4 link.

This stops copied links and the browser's download button. It can't stop someone who is allowed to watch from recording their screen; only paid DRM (Widevine / FairPlay, e.g. through a video host) makes that harder.

## Seeding the course

`npm run seed:claude-code -- <folder>` uploads the lesson videos and creates the courses: 「Claude Code 入門」 (`<folder>/lesson-NN/out/video.mp4`, 20 lessons), 「Claude Code を自分仕様にする」 (`<folder>/c2-NN/out/video.mp4`, 8 lessons) and 「コードを書かずに、自分のサイトを作って公開する」 (`<folder>/c3-NN/out/video.mp4`, 11 lessons). Courses that already exist are not created again; the script only sets their lessons' `isFree` flags to match its `freeLessons` lists (and stops without changes if the lesson count or titles don't match). Needs `ADMIN_EMAIL` and `ADMIN_PASSWORD`; `SEED_API_URL` picks the server (default `http://localhost:5000/api`). Run `npm run video:hls` afterwards.

Free lessons (about 30% of each course, spread out so visitors see a bit of everything; the final review lessons stay for members): 入門 1, 4, 10, 12, 15, 18 · 自分仕様 1, 2, 7 · サイト 1, 2, 6, 9. The course cards show the count (「うちN本は無料」) and the lesson list marks them 無料.

## Course cover images

Each course can have one 16:9 cover image (JPG, PNG or WebP, up to 5MB; about 1600×900 is best). Admins add, replace or remove it in 講座の管理 → 編集 → 表紙の画像. The API is `POST /api/admin/courses/:courseId/cover` (multipart, field `cover`) and `DELETE /api/admin/courses/:courseId/cover`. Files go to the private bucket under `course-covers/<courseId>/`, the course stores the plain S3 URL in `coverImageUrl`, and responses carry a presigned link like other media. The cover shows on the course cards and on the course page (sidebar on desktop, a small image next to the title on phones). Without a cover the cards look as before.

The column comes from the migration `AddCourseCoverImage`. Deploys don't run migrations, so run `npm run migration:run` against the production database before deploying code that needs a new column.

## Community sample threads

The 「みんなの投稿」 tab has 10 labeled example threads (questions about the three courses, with a teacher's answer). Every one of them has `isSample = true` on `posts` and `comment`, so the UI shows a 「サンプル投稿」 badge and a note under the post; real posts never get the flag. The authors are sample accounts named 「受講者A（例）」…「講師（例）」 (`sample-user-*`, `@example.com`, inactive, not verified, no usable password), so nobody can sign in as them. The images are mock screenshots in `backend/src/scripts/sample-media/`, uploaded to `community/sample-posts/` in the bucket.

`npm run sample-posts -- seed` adds or updates them (safe to re-run; the content is in `src/scripts/sampleCommunityPosts.data.ts`), `-- status` shows counts, and `-- remove` deletes only the sample rows, the sample accounts, every comment on a sample post and the images. Needs the `AddSampleFlags` migration. `DATABASE_URL` picks the database.

## Google sign-in

「Google で続ける」 on the login and registration pages uses Google Identity Services. The browser gets an ID token from Google and posts it to `POST /api/auth/google`; the server checks it against `GOOGLE_CLIENT_ID` and signs the user in, creating the account on first use (email already verified by Google, no password; they can set one later with "forgot password"). Email lookups are case-insensitive, so an existing email account and a Google account with the same address are the same user. The client ID is public and is served to the pages by `GET /api/auth/config`; no client secret is used. The OAuth client lives in GCP project `nipporia-lp-493210` (Google Auth Platform → Clients), with `https://academy.nipporia.com`, `http://localhost:3000` and `http://localhost` as JavaScript origins.

## Production (Cloud Run)

One Cloud Run service, `nipporia-academy` in `asia-northeast1`, project `nipporia-lp-493210`, mapped to **academy.nipporia.com**. The root `Dockerfile` builds the React app and the API into one image; Express serves the site, the API under `/api`, and the course landing page under `/claude-code/` (from `landing/`). The bare domain redirects to `/claude-code/`.

- Deploy: automatic on every push or merged PR to `main` (`.github/workflows/deploy.yml`, visible in the Actions tab). GitHub signs in to Google Cloud without keys (Workload Identity Federation, provider `github/nipporia-academy`, trusted only for this repo's `main`) as `academy-deployer`; images are built by `academy-builder`. By hand: `bash deploy/deploy.sh` (build + deploy) or `bash deploy/deploy.sh <tag>` (redeploy an existing image).
- Secrets are in Secret Manager (`academy-*`), read by the service account `nipporia-academy-run`. Nothing secret is in the repo.
- Live payments: copy the live Stripe secret key, then run `powershell -ExecutionPolicy Bypass -File deploy\enable-stripe-live.ps1`. It stores the key, creates the live prices, customer portal and webhook (`backend/src/scripts/setupStripeLive.ts`), and updates the service. Until then, payment calls are off.
- S3: the bucket's CORS allows `https://academy.nipporia.com` and `http://localhost:3000` (needed for the encrypted video pieces).
- Database: Neon project "Nipporia AI Academy". Branch `production` is the live database (its URL is only in Secret Manager); branch `dev` (a copy made on 2026-11-20) is for local development, so put the `dev` branch URL in `backend/.env`. History retention on the current plan is 1 day, so point-in-time restore only reaches back one day.
