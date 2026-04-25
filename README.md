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
NEXT_PUBLIC_SITE_URL="https://your-production-domain.com"
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

## SEO and Google Search Console

Set `NEXT_PUBLIC_SITE_URL` to the canonical production domain before deploying.
The app generates:

- `/robots.txt`
- `/sitemap.xml`
- canonical, Open Graph, Twitter, and robots metadata for the home page

For Google Search Console:

1. Add the production domain as a URL-prefix property or domain property.
2. Verify ownership with the DNS TXT record or Google-provided HTML file.
3. Submit `https://your-production-domain.com/sitemap.xml`.
4. Use URL Inspection for the home page and request indexing after deployment.

## Architecture Notes

The app is split around product domains: `entries`, `feed`, `featured`, `reactions`, `auth`, `guest-authorship`, `profile`, `moderation`, and `i18n`. See `docs/backend-roadmap.md` for the backend foundation and next steps.
