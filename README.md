# Nipporia AI Academy

Japanese video courses for AI tools, with a member community. The first course is 「Claude Code 入門」 (20 short lessons).

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

Without `RESEND_API_KEY` emails are printed to the backend console. Without `STRIPE_SECRET_KEY` payment calls are disabled.

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

`npm run seed:claude-code -- <folder>` uploads the lesson videos and creates both courses: 「Claude Code 入門」 (`<folder>/lesson-NN/out/video.mp4`, 20 lessons) and 「Claude Code を自分仕様にする」 (`<folder>/c2-NN/out/video.mp4`, 8 lessons). Lesson 1 of each is free. Courses that already exist are skipped. Needs `ADMIN_EMAIL` and `ADMIN_PASSWORD`; run `npm run video:hls` afterwards.
