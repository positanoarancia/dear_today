# Dear, Today Backend Roadmap

This project now has a Postgres-backed MVP foundation. The UI still keeps an optimistic local layer for responsiveness, but public feed writes, reactions, guest ownership checks, and account-owned archive reads can round-trip through API routes.

## Module Boundaries

- `entries`: create, update, delete, ownership checks, body validation.
- `feed`: latest-first retrieval, pagination cursor, stable new-entry banner behavior.
- `featured`: replaceable selection logic for a warm, fresh featured note.
- `reactions`: heart-only toggle with one reaction per actor key.
- `guest-authorship`: guest password hashing and verification.
- `auth`: Google-first Auth.js route plus an isolated app session helper while OAuth credentials are being configured.
- `moderation`: rate limits, removal events, future report/block hooks.
- `i18n`: locale normalization and future translation-friendly storage.

## Initial Schema

The first Drizzle migration lives at `src/server/db/migrations/0000_daffy_sue_storm.sql`.

It creates:

- `profiles`
- `guest_ownerships`
- `gratitude_entries`
- `entry_reactions`
- `moderation_events`

## Recommended DB Wiring

Use Neon Postgres or another Postgres provider with a pooled serverless connection string.

Recommended environment variable:

```bash
DATABASE_URL="postgres://..."
AUTH_SECRET="replace-with-a-random-secret"
AUTH_GOOGLE_ID="your-google-oauth-client-id"
AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"
```

Installed database packages:

```bash
@neondatabase/serverless
drizzle-orm
drizzle-kit
next-auth@beta
```

Keep DB initialization lazy. In Next.js builds, static generation can evaluate modules before runtime environment variables are present.

## Google OAuth Setup

Auth.js v5 is wired at `src/auth.ts` and `src/app/api/auth/[...nextauth]/route.ts`.

Before real Google login can complete, create a Google OAuth Client and add these redirect URIs:

```text
http://localhost:3000/api/auth/callback/google
https://YOUR_PRODUCTION_DOMAIN/api/auth/callback/google
```

Then set:

```bash
AUTH_SECRET="..."
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
```

`AUTH_SECRET` should also be set in production. You can generate a strong local value with `openssl rand -base64 32`.

## Next Implementation Steps

1. Add real Google OAuth credentials to `.env.local` and Vercel.
2. Verify the Google OAuth callback creates/updates a profile and returns the user to `/account`.
3. Keep `GET /api/entries?mine=1` as the account archive source.
4. Add profile-owned edit/delete browser verification.
5. Seed and/or clean test data before first public deployment.

Implemented backend pieces:

- Lazy database client: `src/server/db/client.ts`
- Drizzle schema: `src/server/db/drizzle-schema.ts`
- Entry repository/actions: `src/server/entries`
- Reaction repository/actions: `src/server/reactions`
- API routes:
  - `GET /api/auth/[...nextauth]`
  - `POST /api/auth/[...nextauth]`
  - `GET /api/account/session`
  - `POST /api/account/session` temporary local demo session helper
  - `DELETE /api/account/session` temporary local demo logout helper
  - `GET /api/entries`
  - `POST /api/entries`
  - `PATCH /api/entries/:entryId`
  - `DELETE /api/entries/:entryId`
  - `POST /api/reactions`
