# Supabase database

The remote Supabase project is the application runtime target. The SQL in this
folder is the reproducible source of truth and can also be validated in an isolated
local Supabase instance when Docker is available.

## Files

| Path                  | Purpose                                                                          |
| --------------------- | -------------------------------------------------------------------------------- |
| `migrations/`         | Versioned schema, RPC/RLS and Storage policies. Never edit an applied migration. |
| `tests/core.test.sql` | pgTAP coverage for RLS allow/deny rules and core RPCs.                           |
| `seed.sql`            | Reference categories, only for local development.                                |
| `config.toml`         | Supabase CLI local configuration.                                                |

## Deploy to the remote project

### 1. Repository secrets (GitHub → Settings → Secrets and variables → Actions)

| Secret                  | Required | Where to get it                                                                                                     |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| `SUPABASE_PROJECT_REF`  | yes      | Project Settings → General → Reference ID.                                                                          |
| `SUPABASE_DB_PASSWORD`  | yes\*    | Project Settings → Database → DB password (reset it there if needed).                                               |
| `SUPABASE_ACCESS_TOKEN` | no\*\*   | Account → Access Tokens (only needed to link without the DB password, or to deploy functions with `--project-ref`). |
| `SUPABASE_URL`          | no       | Project URL, used by the post-deploy smoke check.                                                                   |
| `SUPABASE_ANON_KEY`     | no       | Publishable/anon key, used by the post-deploy smoke check.                                                          |

\* Required when `SUPABASE_ACCESS_TOKEN` is not set.
\*\* Optional, but recommended: `supabase link` and function deploys are more reliable with it.

Create them with:

```bash
gh secret set SUPABASE_PROJECT_REF
gh secret set SUPABASE_DB_PASSWORD
gh secret set SUPABASE_ACCESS_TOKEN   # optional
gh secret set SUPABASE_URL           # optional
gh secret set SUPABASE_ANON_KEY      # optional
```

### 2. Run the workflow

- **Manual (safe default):** Actions → _Deploy Supabase_ → _Run workflow_, leaving
  `dry_run` enabled. It lists the pending migrations and changes nothing.
- **Apply:** set `dry_run = false`. The workflow links the project, runs
  `supabase db push`, optionally deploys `functions/` and finally calls
  `search_products` to confirm the schema is live.
- **Automatic:** pushing to `master`/`main` with changes under `project/supabase/`
  applies the pending migrations (no dry run).

### 3. From a machine, without CI

```bash
cd project/supabase
supabase login                      # or export SUPABASE_ACCESS_TOKEN
supabase link --project-ref <ref> --password '<db-password>'
supabase db push --include-all      # first deploy of a new project
```

## After the first deploy

1. Confirm email confirmation is enabled (Authentication → Providers → Email).
2. Add the redirect URLs for `https://<seu-dominio>/auth/confirm` and the Expo scheme.
3. Create the first account in the app, then promote it:

```bash
cd project
pnpm admin:promote -- <email>
```

4. Optionally apply the reference categories to the remote project by hand
   (`seed.sql` is intentionally not applied automatically in production).

## Local validation

```bash
cd project
pnpm db:start     # requires Docker
pnpm db:lint
pnpm db:test
pnpm db:reset
pnpm db:stop
```

## Never commit

Database passwords, `service_role`/`sb_secret_` keys and access tokens. Rotate any
key that has been pasted into a chat, an issue or a commit.
