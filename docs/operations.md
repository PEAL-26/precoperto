# Operations runbook

## First remote setup

1. Create a Supabase project.
2. Enable email confirmation and configure the Site URL/redirect URL for the web
   confirmation endpoint.
3. Create a publishable key for Web/Mobile and a secret/service key for the backend
   package only.
4. Set the project URL and keys in the local environment files.
5. Apply the migrations in `project/supabase/migrations` with the Supabase CLI or
   the _Deploy Supabase_ GitHub workflow.
6. Register a user, confirm the email, then run `pnpm admin:promote <email>`.

## Deploying the database

Two supported paths, both applying the same `project/supabase/migrations` folder.

### GitHub Actions (recommended)

Workflow: `.github/workflows/deploy-supabase.yml`.

| Secret                  | Required | Notes                                                        |
| ----------------------- | -------- | ------------------------------------------------------------ |
| `SUPABASE_PROJECT_REF`  | yes      | Reference ID of the target project.                          |
| `SUPABASE_DB_PASSWORD`  | yes\*    | Needed for the direct Postgres connection used by `db push`. |
| `SUPABASE_ACCESS_TOKEN` | no\*\*   | Lets the CLI link and deploy functions without the password. |
| `SUPABASE_URL`          | no       | Enables the post-deploy RPC smoke check.                     |
| `SUPABASE_ANON_KEY`     | no       | Key used by the post-deploy RPC smoke check.                 |

\* required unless `SUPABASE_ACCESS_TOKEN` is set.
\*\* strongly recommended: without it, the database password is used to link.

Behaviour:

- _Manual run_ defaults to `dry_run = true`, which lists pending migrations and
  exits without changing anything.
- _Push to `master`/`main`_ touching `project/supabase/**` applies the pending
  migrations.
- Edge Functions under `project/supabase/functions/` are deployed after the
  migrations when they exist.
- The job is serialized with `concurrency` and targets the `production`
  environment, so branch protection can require a review.
- After applying, the workflow calls `rpc/search_products` with the public key and
  fails if it does not answer `200`, catching a half-applied schema.

### Local machine

```bash
cd project
pnpm db:link -- --project-ref <ref> --password '<db-password>'
pnpm db:push
```

## Secret handling

- Public variables: `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or the newer publishable key).
- Mobile public variables: `EXPO_PUBLIC_SUPABASE_URL` and
  `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Server-only: `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.
- CI-only: `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `SUPABASE_ACCESS_TOKEN`.
- Never place server-only variables in a client `.env`, mobile bundle, browser
  request, issue, log or committed file.
- New-style `sb_publishable_…` and `sb_secret_…` keys replace the legacy
  `anon`/`service_role` JWTs; projects created with the new keys reject the legacy
  JWTs even if they are still listed in the dashboard.

## Incident checks

- Inspect RLS advisors and Storage policies after every migration.
- Confirm all domain tables have RLS enabled and default client grants revoked.
- Confirm public search never exposes private Store contacts or exact coordinates.
- Confirm category deletion is rejected while products reference the category.
- Rotate any key that has appeared in logs or an untrusted channel. A key pasted
  into a chat, an issue or a commit must be considered compromised.
