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

## Seeding the course

`npm run seed:claude-code -- <folder>` uploads the lesson videos (`<folder>/lesson-NN/out/video.mp4`) and creates the 「Claude Code 入門」 course (needs `ADMIN_EMAIL` and `ADMIN_PASSWORD`).
