# Types package conventions

- Keep this package platform-neutral: no React, DOM, Node or Expo imports.
- Database column names and domain entities follow the Supabase schema exactly.
- Add a type near its owning domain and export it through `src/index.ts`.
- Use `camelCase` for application-facing TypeScript properties only when they are not
  serialized database fields; keep RPC/table row fields aligned with the database.
- Treat all API and database input as untrusted at the schema boundary.
- Do not add runtime validation here; use `@precoperto/schemas` for that.
