# Hadley’s Kitchen Bake Planner

Mobile-first production planning for market bakers. The app stores reusable gram-based recipes, guides a focused five-step event workflow, and calculates batches, flour, starter, shopping, oven blocks, CSV, print/PDF, and optional Google exports.

## Local setup

1. Copy `.env.example` to `.env.local` and provide the public Supabase URL and publishable key.
2. Run `npm install`, then `npm run dev`.
3. Apply the SQL migrations in `supabase/migrations` in numeric order.
4. In Supabase Auth, enable Google and email link sign-in and add `/api/auth/callback` URLs for local, preview, and production environments.

Without environment variables, development runs as an interactive in-memory sample. Authentication and cloud persistence remain disabled; production always requires Supabase.

## Google export setup

Create a separate Google OAuth web client for Drive export. Enable Drive, Docs, and Sheets APIs; configure `/api/google/callback`; and add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a random 32+ byte `GOOGLE_TOKEN_ENCRYPTION_KEY` in Vercel. The integration uses the limited `drive.file` scope. Google sign-in remains separate and does not request Drive access.

## Vercel

Create a second Vercel project from this repository with Root Directory `apps/bake-planner`, then attach `app.hadleyskitchen.com`. Configure environment variables separately from the public bakery site.

## Checks

```sh
npm test
npm run typecheck
npm run lint
npm run build
```
