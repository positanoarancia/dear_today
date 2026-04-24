# Dear, Today

`Dear, Today` is a quiet public gratitude journal. People can write short notes of gratitude, read a calm public feed, and leave a lightweight heart without comments or social pressure.

## v0.1 Scope

- Public gratitude feed with latest and today's-heart sorting
- Text-only writing with guest password ownership
- Google Auth.js sign-in for account-owned notes
- My Posts archive for signed-in writing
- Heart-only reactions with per-actor deduplication
- Korean/English UI copy foundation
- Postgres persistence through Neon-compatible Drizzle schema
- Mobile-first editorial card interface

## Tech Stack

- Next.js App Router
- React
- Tailwind CSS
- Auth.js / NextAuth Google provider
- Neon Serverless Postgres
- Drizzle ORM

## Local Setup

Create `.env.local` from `.env.example` and fill in the values.

```bash
npm install
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

```bash
DATABASE_URL="postgres://..."
AUTH_SECRET="..."
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
```

For Google OAuth, add this local redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

For production, also add:

```text
https://YOUR_PRODUCTION_DOMAIN/api/auth/callback/google
```

## Useful Commands

```bash
npm run lint
npm run build
npm run db:generate
npm run db:migrate
```

## Architecture Notes

The app is split around product domains: `entries`, `feed`, `featured`, `reactions`, `auth`, `guest-authorship`, `profile`, `moderation`, and `i18n`. See `docs/backend-roadmap.md` for the backend foundation and next steps.
