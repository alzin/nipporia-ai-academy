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

`npm run seed:claude-code -- <folder>` uploads the lesson videos (`<folder>/lesson-NN/out/video.mp4`) and creates the 「Claude Code 入門」 course (needs `ADMIN_EMAIL` and `ADMIN_PASSWORD`).
