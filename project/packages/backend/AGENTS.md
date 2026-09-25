# Backend package conventions

- This package is server-only. Never import it from `apps/mobile` or a Client
  Component in `apps/web`.
- User-facing operations must still run with the caller's authenticated Supabase
  client so RLS remains the authorization boundary.
- Service-role/secret-key operations are allowed only for narrowly scoped bootstrap,
  migration or administrative tooling; never return that client to a request handler.
- Keep `search_path` pinned and schema-qualified in every SQL `SECURITY DEFINER`
  function.
- Do not trust role, user id or ownership values received from a browser; resolve them
  through the authenticated session/RLS or server-side validation.
- Keep CLI secrets in environment variables and print only safe success/error messages.
