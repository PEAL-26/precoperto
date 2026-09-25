# Supabase project conventions

- Put every reproducible database change in `migrations/`; never edit a deployed
  migration in place.
- Enable RLS and explicitly revoke default client grants for every exposed table.
- Use separate `select`, `insert`, `update` and `delete` policies and include both
  `using` and `with check` for writes.
- Treat `private` security-definer helpers as privileged code: pin `search_path = ''`
  and schema-qualify every object.
- Use PostGIS from the `extensions` schema and keep a GIST index on store locations.
- Public RPCs must explicitly filter status/visibility and must not return private
  contact/location fields to unauthorized callers.
- Use CUID-shaped application IDs, not Auth UUIDs, for domain rows.
- Keep category deletion restricted while products reference a category.
- Add pgTAP coverage under `tests/` for every allow/deny policy and core RPC.
- Never place a service-role key in seed files or client configuration.
