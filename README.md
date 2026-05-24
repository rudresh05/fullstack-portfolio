# Rudresh Portfolio

Next.js portfolio with an authenticated Studio for managing projects, blogs, navigation, socials, skills, experience, and contact content.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Required Environment Variables

Public client variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_ADMIN_EMAIL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Server-only production variables:

```env
FIREBASE_SERVICE_ACCOUNT=
SUPABASE_SERVICE_ROLE_KEY=
```

Never prefix server-only variables with `NEXT_PUBLIC_`.

## Supabase Setup

Run [sql/supabase_schema.sql](sql/supabase_schema.sql) in the Supabase SQL editor.

For production, keep Row Level Security enabled if you want; Studio writes go through Next.js API routes using `SUPABASE_SERVICE_ROLE_KEY`.

For local development only, if you do not have a service-role key configured, you can temporarily disable RLS using the commented SQL in `sql/supabase_schema.sql`.

## Firebase Setup

1. Enable Email/Password sign-in in Firebase Authentication.
2. Create the admin user.
3. Set `NEXT_PUBLIC_ADMIN_EMAIL` to that email.
4. Generate a Firebase service account JSON for deployment and store it as a single-line `FIREBASE_SERVICE_ACCOUNT` env var.

If a service-account key is ever pasted publicly, revoke it and generate a new one.

## Routes

- `/` portfolio homepage
- `/blog` blog listing
- `/login` admin login
- `/studio` admin content studio
- `/api/content` content API

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```
