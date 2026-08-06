# Hadley’s Kitchen Bake Planner

Mobile-first production planning for market bakers. The app stores reusable gram-based recipes, guides a focused five-step event workflow, and calculates batches, flour, starter, shopping, oven blocks, CSV, print/PDF, and optional Google exports.

## Local setup

1. Copy `.env.example` to `.env.local` and provide the public Supabase URL and modern `sb_publishable_...` key. Do not wrap either value in quotes.
2. Run `npm install`, then `npm run dev`.
3. Apply the SQL migrations in `supabase/migrations` in numeric order.
4. In Supabase Auth, enable Google and email link sign-in and add `/api/auth/callback` URLs for local, preview, and production environments.

Without environment variables, development runs as an interactive in-memory sample. Authentication and cloud persistence remain disabled; production always requires Supabase.

## Zero-cost recipe importer

Guided manual recipe import is always available and never sends recipe content to an AI provider.

Optional AI-assisted import uses Gemini's unpaid quota directly, without an SDK, gateway, paid OCR service, or billing account. To enable it:

1. Create a Gemini API key in a Google project that has no Cloud Billing account attached.
2. Set `RECIPE_IMPORT_AI_ENABLED=true` and provide `GEMINI_API_KEY`.
3. Keep `GEMINI_RECIPE_IMPORT_MODEL` on a model available in the unpaid tier.
4. Set conservative per-user and global daily limits. When either limit or Google's quota is exhausted, the AI endpoint stops and users continue with manual import.

The unpaid Gemini service may use submissions and responses to improve Google products and may involve human review. The UI requires a versioned disclosure and explicit consent before every request. Uploaded files are sent inline for one request and are not retained by this app.

If the free tier or its terms stop being suitable, set `RECIPE_IMPORT_AI_ENABLED=false`. Manual import and saved recipes continue to work.

## Google export setup

Create a separate Google OAuth web client for Drive export. Enable Drive, Docs, and Sheets APIs; configure `/api/google/callback`; and add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a random 32+ byte `GOOGLE_TOKEN_ENCRYPTION_KEY` in Vercel. The integration uses the limited `drive.file` scope. Google sign-in remains separate and does not request Drive access.

## Vercel

Create a second Vercel project from this repository with Root Directory `apps/bake-planner`, then attach `app.hadleyskitchen.com`. Configure environment variables separately from the public bakery site. Use only the canonical `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` names in every deployment environment.

## Checks

```sh
npm test
npm run typecheck
npm run lint
npm run build
```
