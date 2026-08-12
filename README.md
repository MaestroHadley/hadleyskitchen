# Hadley's Kitchen Website

This repository contains the Hadley's Kitchen bakery website deployed at `hadleyskitchen.com`.

Hearthworks was extracted to its independent [`MaestroHadley/Hearthworks`](https://github.com/MaestroHadley/Hearthworks) repository on August 12, 2026. Its final source state in this repository is preserved by the `hearthworks-extraction-2026-08-12` tag.

The website owns its dependencies and lockfile in `apps/website`. The repository intentionally does not use npm workspaces.

## Commands

Run application commands from the repository root:

```sh
npm run dev:website
npm run build:website
npm run lint:website
```
