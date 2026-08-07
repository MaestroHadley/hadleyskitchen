# Hearthworks Architecture

## Application boundaries

- `apps/website` is the public Hadley's Kitchen marketing site deployed at `hadleyskitchen.com`.
- `apps/platform` is the Hearthworks operational application deployed at `app.hadleyskitchen.com`.
- Both applications deploy independently from the same GitHub repository and keep independent dependencies and lockfiles.

## Data and integrations

- Supabase is the source of truth for authentication and structured private operational data. Every current public-schema table has row-level security enabled.
- Google sign-in is separate from the optional Google Drive, Docs, and Sheets connection. Exports are one-way snapshots owned by the baker.
- Cloudflare R2 is reserved for future public product media. Expense receipts and private reports do not belong in R2.
- Vercel hosts both Next.js applications as separate projects with separate environment-variable configuration.

## Canonical records

- Product direction and phased implementation: `docs/platform/product-plan.md`
- Repository move and rollback record: `docs/platform/repository-migration.md`
- Theme system: `docs/platform/themes.md`
- Historical visual QA: `docs/platform/design-qa.md`
- Platform database migrations: `apps/platform/supabase/migrations`
