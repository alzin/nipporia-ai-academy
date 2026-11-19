# Nipporia AI Academy — conversion plan

Starting point: the Thrive in Japan platform (React CRA + MUI frontend, Express + TypeORM + Postgres backend).
Goal: a Japanese-language platform for AI-tool video courses (first course: 「Claude Code 入門」, 20 short videos) with a member community.

## What to remove completely (code, routes, UI, DB tables)
- Speaking sessions: sessions, bookings, calendar, trial-session booking requirement, alternative-time requests, meeting service, booking validation, admin session management, "upcoming sessions" widgets.
- Points and levels: profile points/level/badges, lesson `pointsReward`, admin "manage points", points balance, achievements that depend on points, course levels (`Level` entity, `/levels` routes, `/classroom/:levelId` routes, `course.levelId`).
- Japanese-learning specifics: course `type` enum (JAPAN_IN_CONTEXT / JLPT_IN_CONTEXT), KEYWORDS lesson type and keyword flashcards / CSV keyword import, pronunciation / listening slides, `languageLevel`.
- Profile pages: `/profile`, public profile `/profile/:userId`, public profile API, profile photo upload. Keep only the user's display name (stored on Profile.name), shown in the header.
- "Student of Shiego" special registration/subscription pages and their price IDs.
- The old logo image. Brand is plain text: **Nipporia AI Academy**.

Keep: auth (register, email verification, login, password reset), courses and lessons (VIDEO, PDF, QUIZ, SLIDES), progress / lesson completion, community posts, comments, likes, announcements, media upload to S3, admin course/lesson management, admin users, community moderation, analytics, Stripe subscription + customer portal, tour/welcome video.

## Who can do what
| | Guest (not logged in) | Logged in, no active subscription | Active subscriber or ADMIN |
|---|---|---|---|
| Browse dashboard, course list, course page, lesson list | yes | yes | yes |
| Watch / open a lesson | free lessons only | free lessons only | all |
| Mark lesson complete, progress | no | free lessons only | yes |
| Read community posts, comments, announcements | yes (read-only) | yes (read-only) | yes |
| Post, comment, like, upload media | no | no | yes |

- A lesson is **free** when `lesson.isFree === true` OR `lesson.order <= course.freeLessonCount`. Admins set `isFree` per lesson in the lesson form.
- The **server** enforces this. For a locked lesson the API returns metadata only (`id, courseId, title, description, order, lessonType, isFree, isLocked: true`) and never `contentUrl`, `contentData`, `audioFiles` or `resources`.
- "Active subscription" = the existing subscription check (`active` or `trialing`), ADMIN always passes.

## API contract (backend ⇄ frontend)
- New middleware `optionalAuthenticate`: sets `req.user` when a valid access token cookie exists, otherwise continues as guest (never 401).
- New middleware `requireActiveSubscription` (after `authenticate`): 403 `{ error: 'SUBSCRIPTION_REQUIRED' }` unless active subscriber or ADMIN.
- Public (optional auth) GET endpoints:
  - `GET /api/courses` → list of active courses with lesson counts (no level filter, no type).
  - `GET /api/courses/:courseId`
  - `GET /api/courses/:courseId/lessons` → each lesson has `isFree`, `isLocked`, `isCompleted` (false for guests).
  - `GET /api/courses/lessons/:lessonId` → locked lessons return metadata only with `isLocked: true` (HTTP 200).
  - `GET /api/community/posts`, `GET /api/community/posts/:postId/comments`, `.../comments/count`, `GET /api/community/comments/:commentId`, `.../replies`
  - `GET /api/announcements`, `GET /api/announcements/:id`, `.../comments`, `.../comments/count`
  - `GET /api/dashboard` → for guests returns course list + empty progress.
- Write endpoints in community, announcements (non-admin parts), feedback and media upload: `authenticate` + `requireActiveSubscription`.
- `POST /api/courses/lessons/:lessonId/complete`: `authenticate`; 403 if the lesson is locked for that user.
- Removed route groups: `/api/bookings`, `/api/calendar`, `/api/sessions`, `/api/levels`, `/api/public/profile`; profile routes reduced to `GET/PUT /api/profile/me` (name only).
- `GET /api/auth/check` (or the existing equivalent) keeps returning the user with `name`.

## Database
New Neon database, so no data migration. Delete the old migration files and generate one clean initial migration from the final entities (done once the Neon connection string is in `backend/.env`).

## UI
- All UI text in natural Japanese (です・ます, short and plain), run through the humanizer-ja rules.
- Visual style matches the course landing page: warm paper background `#F4F1EB`, card `#FFFDF9`, ink `#23211D`, muted `#5F5B54`, line `#E3DDD2`, accent `#AE4A24` (hover `#8F3B1B`, soft `#F8E6DD`), blue links `#3C5A80`; font "Zen Kaku Gothic New" (Google Fonts) with `font-feature-settings: "palt"`; 8–14px radii; soft shadows; no gradients, no glassmorphism, no emoji icons.
- Header: text brand "Nipporia AI Academy", nav ホーム / 講座 / コミュニティ, right side shows the user's name only (menu: サブスクリプション管理, ログアウト; admin link for ADMIN). Guests see ログイン and 無料で登録.
- Locked lesson: lock icon + short message. Guest → 「登録・ログイン」; logged in without subscription → 「メンバーになる」 (/subscription).
- Community for guests and non-members: posts visible, input box replaced by a short join prompt, like/comment buttons disabled with a tooltip.
