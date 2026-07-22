# Hadley’s Kitchen Bake Planner

Mobile-first production planning for market bakers. The app stores reusable gram-based recipes, guides event setup, and calculates batches, flour, starter, shopping, mixer loads, oven blocks, packaging, CSV, print/PDF, and optional Google exports.

## Local setup

1. Copy `.env.example` to `.env.local` and provide newly rotated public Supabase values. Never reuse credentials previously shared in chat.
2. Run `npm install`, then `npm run dev`.
3. Apply `supabase/migrations/001_initial_planner.sql` to the connected Supabase project.
4. In Supabase Auth, enable Google and email link sign-in and add `/api/auth/callback` URLs for local, preview, and production environments.

Without environment variables, the interface runs safely as an interactive local sample using browser storage. Authentication and cloud persistence remain disabled.

## Google export setup

Create a separate Google OAuth web client for Drive export. Enable Drive, Docs, and Sheets APIs; configure `/api/google/callback`; and add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a random 32+ byte `GOOGLE_TOKEN_ENCRYPTION_KEY` in Vercel. Google sign-in remains separate and does not request Drive scopes.

## Vercel

Create a second Vercel project from this repository with Root Directory `apps/bake-planner`, then attach `app.hadleyskitchen.com`. Configure environment variables separately from the public bakery site.

## Checks

```sh
npm test
npm run typecheck
npm run lint
npm run build
```
