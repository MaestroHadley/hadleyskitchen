# Hadley's Kitchen Repository

This repository contains two independently deployed Next.js applications.

| Application | Path | Production domain |
|---|---|---|
| Hadley's Kitchen website | `apps/website` | `hadleyskitchen.com` |
| Hearthworks platform | `apps/platform` | `app.hadleyskitchen.com` |

Each application owns its dependencies and lockfile. The repository intentionally does not use npm workspaces or a shared build system.

## Commands

Run application commands from the repository root:

```sh
npm run dev:website
npm run build:website
npm run lint:website

npm run dev:platform
npm run build:platform
npm run typecheck:platform
npm run test:platform
npm run lint:platform
```

Architecture, product planning, and migration records live in `docs/platform`.
