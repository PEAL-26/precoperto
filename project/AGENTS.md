# PrecoPerto monorepo

## Purpose

This directory is the implementation root for PrecoPerto V1. It contains the Next.js
web app, Expo mobile app, shared packages, Supabase migrations and tests.

## Architecture rules

- Keep application features in `apps/`; keep business contracts and reusable logic in
  `packages/`.
- `packages/types`, `packages/schemas` and `packages/utils` must remain platform-neutral.
- `packages/supabase` is the client-safe Supabase boundary. It may be imported by Web
  and Expo, but must never import server-only code or service-role credentials.
- `packages/backend` is server-only. It owns privileged/server-side Supabase workflows
  and may be imported by Next.js server code or the admin CLI only.
- Never put a service-role/secret key behind a `NEXT_PUBLIC_` or `EXPO_PUBLIC_` name.
- Use the Supabase JS SDK and SQL/RLS directly; do not add an ORM in V1.
- Keep user-facing copy in Portuguese and code identifiers in English.
- Prefer small components and pure helper functions over large conditional components.
- Do not add a web-only UI library to a package consumed by Expo.
- Keep migrations, RPC functions, RLS policies and Storage policies versioned and tested.
- Add an `AGENTS.md` to every workspace before adding project-specific conventions.

## Commands

Run commands from this directory with pnpm:

- `pnpm install`
- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm format:check`

The remote Supabase project is the runtime target. Local Supabase is optional for
application development; CI can use an isolated local instance for database checks.
