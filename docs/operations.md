# Operations runbook

## First remote setup

1. Create a Supabase project.
2. Enable email confirmation and configure the Site URL/redirect URL for the web
   confirmation endpoint.
3. Create a publishable key for Web/Mobile and a secret/service key for the backend
   package only.
4. Set the project URL and keys in the local environment files.
5. Apply the migrations in `project/supabase/migrations` with the Supabase CLI.
6. Register a user, confirm the email, then run `pnpm admin:promote <email>`.

## Secret handling

- Public variables: `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or the newer publishable key).
- Mobile public variables: `EXPO_PUBLIC_SUPABASE_URL` and
  `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Server-only: `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.
- Never place server-only variables in a client `.env`, mobile bundle, browser
  request, issue, log or committed file.

## Incident checks

- Inspect RLS advisors and Storage policies after every migration.
- Confirm all domain tables have RLS enabled and default client grants revoked.
- Confirm public search never exposes private Store contacts or exact coordinates.
- Confirm category deletion is rejected while products reference the category.
- Rotate any key that has appeared in logs or an untrusted channel.
