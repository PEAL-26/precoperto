# PrecoPerto V1

Monorepo for the PrecoPerto product described in [`../docs/spec.md`](../docs/spec.md).

## Workspaces

- `apps/web` — Next.js App Router web application.
- `apps/mobile` — Expo Router React Native application. `pnpm --filter @precoperto/mobile build` uses a deterministic single-worker web export; `build:production` enables Expo's normal minification for release pipelines.
- `packages/types` — database and domain types.
- `packages/schemas` — shared Zod validation contracts.
- `packages/utils` — pure cross-platform helpers.
- `packages/supabase` — client-safe Supabase clients and RLS-backed operations.
- `packages/backend` — server-only Supabase orchestration and admin tooling.
- `supabase` — migrations, RLS/Storage policies, seed data and database tests.

See each workspace's `AGENTS.md` before changing it. The ignored implementation plan
and decision log lives in `.plans/precoperto-v1.md` at the repository root.
