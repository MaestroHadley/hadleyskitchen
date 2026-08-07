# Repository Reorganization Migration Map

Status: local move complete — Vercel Root Directory cutover and preview/production verification pending.

Date: August 6, 2026; local move completed August 7, 2026

## Objective

Keep the public Hadley's Kitchen bakery website and the multi-bakery software platform in one repository while giving each application an explicit boundary:

```text
hadleys-kitchen/
├── apps/
│   ├── website/          # hadleyskitchen.com and www.hadleyskitchen.com
│   └── platform/         # app.hadleyskitchen.com
├── docs/
│   └── platform/
├── packages/             # Do not create until real shared code exists
├── .gitignore
├── package.json          # Lightweight command dispatcher only
└── README.md             # Repository-level orientation
```

`platform` is intentionally temporary. It avoids coupling code, Vercel configuration, database objects, or URLs to a product name before branding and trademark review are complete.

## Verified current deployment boundary

Both Vercel projects use the GitHub repository `MaestroHadley/hadleyskitchen` and currently deploy the same `main` commit independently.

| Application | Vercel project | Production domains | Pre-move root | Repository root after this change |
|---|---|---|---|---|
| Public bakery website | `hadleyskitchen` | `hadleyskitchen.com`, `www.hadleyskitchen.com` | repository root | `apps/website` |
| Microbakery application | `hadleys-bake-planner` | `app.hadleyskitchen.com` | `apps/bake-planner` | `apps/platform` |

The deployment connector confirms both projects, domains, Node.js 24.x, Git repository, and READY production deployments from merged commit `2c37bab`. It does not expose or update the `rootDirectory` property, so the two Vercel project settings must be changed before this branch is pushed for preview.

## Local completion record — August 7, 2026

- Moved the public application into `apps/website` and the operational application into `apps/platform`.
- Moved platform documentation into `docs/platform` and added a concise architecture index.
- Added a lightweight root command dispatcher without workspaces or shared dependency resolution.
- Preserved the public website's existing Vercel Analytics dependency during the move.
- Renamed both application packages without changing dependency versions.
- Completed clean independent installs and production builds; lint passed for both applications, and the platform passed 45 tests plus typecheck.
- Verified both applications at 390 × 844 with no horizontal overflow.
- Reconciled timestamped migration filenames with production Supabase history.

The deployment cutover remains intentionally incomplete until both Vercel Root Directory settings are updated and independent previews pass.

No domains, OAuth callback URLs, Supabase URLs, Google redirect URLs, or customer-facing routes need to change during this repository move.

## Exact path migration

### Public website

Move the complete public-site application from the repository root into `apps/website`:

| Current path | Target path | Notes |
|---|---|---|
| `src/` | `apps/website/src/` | Public-site routes, components, and content only |
| `public/` | `apps/website/public/` | Deployed public bakery images and favicon assets |
| `media/` | `apps/website/source-media/` | Preserve original source photographs; do not delete duplicates during the move |
| `next.config.ts` | `apps/website/next.config.ts` | No configuration change required initially |
| `tsconfig.json` | `apps/website/tsconfig.json` | Remove the old root-only `"exclude": ["node_modules", "apps"]` entry after the move |
| `eslint.config.mjs` | `apps/website/eslint.config.mjs` | Remains local to the website |
| `package.json` | `apps/website/package.json` | Rename package to `hadleys-kitchen-website` |
| `package-lock.json` | `apps/website/package-lock.json` | Regenerate only if the package name changes |
| `README.md` | `apps/website/README.md` | Preserve the current website-specific setup instructions |

Generated root files such as `.next/`, `next-env.d.ts`, and TypeScript build information must not be moved. They are regenerated inside the new application root.

### Platform

Move the full application directory as one history-preserving rename:

| Current path | Target path | Notes |
|---|---|---|
| `apps/bake-planner/` | `apps/platform/` | Includes source, public assets, tests, Supabase migrations, configuration, package metadata, and `.env.example` |
| `apps/bake-planner/design-qa.md` | `docs/platform/design-qa.md` | Move documentation out of executable application code during the same commit |

Platform code uses app-local `@/*` aliases, so application imports do not require mass rewriting. `outputFileTracingRoot: path.join(process.cwd(), "../..")` remains correct because `apps/platform` has the same directory depth as `apps/bake-planner`.

Rename the package metadata from `hadleys-kitchen-bake-planner` to a neutral temporary name such as `microbakery-platform`. Update the matching root package entry in `apps/platform/package-lock.json` without changing dependency versions.

### Platform documentation

| Current path | Target path | Notes |
|---|---|---|
| `hk-app.md` | `docs/platform/product-plan.md` | Canonical phased product and architecture plan |
| `themes.md` | `docs/platform/themes.md` | Subscriber theme system, not public-site styling |
| `apps/bake-planner/design-qa.md` | `docs/platform/design-qa.md` | Historical platform design verification |
| none | `docs/platform/architecture.md` | Create a concise index of deployment, data ownership, integrations, and links to schema decisions |
| none | `docs/platform/repository-migration.md` | This migration contract |

After the move, update every path reference in the product plan and READMEs from `apps/bake-planner` to `apps/platform`.

### Repository root

Keep only repository-wide files at the root:

- `.git/`
- `.gitignore`
- `README.md`
- a lightweight root `package.json`
- optional repository-wide automation added later
- `apps/`
- `docs/`
- `packages/` only after a demonstrated shared-code need

The new root `package.json` should not become a third application and should not introduce npm workspaces or Turborepo during this migration. Use simple forwarding scripts:

```json
{
  "name": "hadleys-kitchen-monorepo",
  "private": true,
  "scripts": {
    "dev:website": "npm --prefix apps/website run dev",
    "build:website": "npm --prefix apps/website run build",
    "lint:website": "npm --prefix apps/website run lint",
    "dev:platform": "npm --prefix apps/platform run dev",
    "build:platform": "npm --prefix apps/platform run build",
    "lint:platform": "npm --prefix apps/platform run lint",
    "test:platform": "npm --prefix apps/platform test",
    "typecheck:platform": "npm --prefix apps/platform run typecheck"
  }
}
```

Keeping independent lockfiles minimizes this move: it does not merge dependency graphs, reconcile the two current Next.js patch versions, or change how either Vercel project installs dependencies. Workspaces, Turborepo, and `packages/ui` should wait until two applications actually import shared source.

## References that must change

The migration commit must update at least these known references:

- `.gitignore`: change `!apps/bake-planner/.env.example` to `!apps/platform/.env.example`
- repository `README.md`: replace the public-site-only README with a two-application orientation and command table
- `apps/platform/README.md`: change the Vercel Root Directory from `apps/bake-planner` to `apps/platform`
- `docs/platform/product-plan.md`: replace every `apps/bake-planner` path with `apps/platform`
- package names and their lockfile root-package names
- any future CI path filters, Dependabot paths, CODEOWNERS rules, or deployment scripts discovered before the move

The current repository contains no tracked GitHub Actions, `vercel.json`, `turbo.json`, npm workspace configuration, or shared package imports that need migration.

## Environment ownership after the move

Environment variables stay attached to their existing Vercel projects; moving source directories does not copy, rename, or merge them.

### Website project

- `NEXT_PUBLIC_SITE_URL`
- Vercel system variable `VERCEL_PROJECT_PRODUCTION_URL`

### Platform project

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_TOKEN_ENCRYPTION_KEY`
- `RECIPE_IMPORT_AI_ENABLED`
- `GEMINI_API_KEY`
- `GEMINI_RECIPE_IMPORT_MODEL`
- `RECIPE_IMPORT_USER_DAILY_LIMIT`
- `RECIPE_IMPORT_GLOBAL_DAILY_LIMIT`
- Vercel system variables such as `VERCEL` and `VERCEL_PROJECT_PRODUCTION_URL`

Do not place real environment values in repository files, migration notes, build logs, or root scripts. The reorganization should compare variable names and environment coverage only.

## Atomic migration sequence

### Gate 1 — Preserve current Phase 0 work

1. Finish reviewing the existing uncommitted importer, responsive-title, hydration, and planning-document changes.
2. Commit them on an intentional branch before any directory move.
3. Record the commit SHA and confirm the working tree is clean.
4. Confirm both current production deployments are READY and retain their deployment IDs for rollback.

Do not mix uncommitted feature implementation with hundreds of path moves. A clean boundary keeps `git diff --find-renames` useful and makes rollback understandable.

### Gate 2 — Perform only mechanical moves

1. Create the migration branch from the committed Phase 0 state.
2. Create `apps/website` and `docs/platform`.
3. Use `git mv` for every path in the migration tables.
4. Do not refactor application behavior, styling, dependencies, database code, or product terminology in the move commit.
5. Confirm Git recognizes the changes as renames rather than deletion and recreation.

### Gate 3 — Repair configuration and documentation

1. Add the lightweight root command dispatcher.
2. Update `.gitignore`, package names, lockfile root names, READMEs, and path references.
3. Create the repository README and platform architecture index.
4. Search for stale paths with:

```sh
rg -n "apps/bake-planner|hadleys-kitchen-bake-planner|themes\.md|hk-app\.md" \
  --glob '!node_modules/**' \
  --glob '!apps/*/node_modules/**'
```

### Gate 4 — Verify both applications locally

Public website:

```sh
cd apps/website
npm ci
npm run lint
npm run build
```

Platform:

```sh
cd apps/platform
npm ci
npm test
npm run lint
npm run build
npm run typecheck
```

Also run both applications simultaneously on different ports and smoke-test their primary routes at desktop and 390 × 844 mobile widths.

### Gate 5 — Coordinate Vercel preview roots

Changing a Vercel Root Directory affects future builds but does not remove or rewrite the currently aliased production deployment.

1. Push the migration branch only after both local builds pass.
2. Change `hadleyskitchen` Root Directory from the repository root to `apps/website`.
3. Change `hadleys-bake-planner` Root Directory from `apps/bake-planner` to `apps/platform`.
4. Trigger preview deployments for the migration branch in both projects.
5. Confirm each preview resolved the intended app—not merely a successful generic Next.js build.
6. Do not merge until both previews are READY and the verification matrix passes.

### Gate 6 — Production cutover

1. Merge the verified migration branch to `main`.
2. Wait for both production deployments to become READY.
3. Confirm domain aliases remain attached to their original Vercel projects.
4. Smoke-test public pages at `hadleyskitchen.com` and authenticated platform routes at `app.hadleyskitchen.com`.
5. Scan both projects for new build and runtime errors.
6. Record deployment IDs and results in the Phase 0 closeout notes.

## Verification matrix

| Surface | Required checks |
|---|---|
| Public website | `/`, `/about`, `/contact`, `/order`, `/cottage-disclosure`, images, metadata, robots, sitemap, mobile navigation |
| Platform signed out | `/`, Google sign-in entry, privacy, terms, protected-route redirect |
| Platform signed in | dashboard, recipes, importer, recipe editing/autosave, event views, finalized report, account |
| Integrations | Supabase session persistence, Google Drive connected state, existing export links; create a new Drive file only with explicit approval |
| Build | both independent `npm ci` installs and production builds from their new roots |
| Responsive | no horizontal overflow at 390 × 844 in both applications |
| Observability | no new browser-console, Vercel build, or Vercel runtime errors |

## Rollback plan

If either preview fails before merge:

1. Restore `hadleyskitchen` Root Directory to the repository root.
2. Restore `hadleys-bake-planner` Root Directory to `apps/bake-planner`.
3. Leave the existing production deployments and domains untouched.
4. Fix the migration branch and retry previews.

If a production deployment fails after merge:

1. Repoint the affected domain/project to its recorded previous READY deployment or use Vercel rollback.
2. Restore that project's previous Root Directory.
3. Revert the migration commit on `main` with a normal revert commit; do not rewrite shared history.
4. Verify the restored production route and runtime logs before retrying.

The two projects can be rolled back independently. A platform failure does not require rolling back the public website if the website deployment is healthy, and vice versa.

## Explicit non-goals

Do not combine these changes with the repository move:

- selecting the platform's final product name
- introducing `packages/ui` or a shared theme system
- adopting npm workspaces, pnpm, or Turborepo
- upgrading Next.js or reconciling dependency versions
- deduplicating or recompressing photographs
- changing Supabase tables, RLS, migrations, or environment values
- changing Google OAuth clients or callback URLs
- changing Vercel project names or production domains
- implementing Phase 1 product features

These may be evaluated after the repository move is stable and both applications have passed production verification.
