# Supabase client package conventions

- This package is client-safe and may be used by both Web and Expo.
- Use the public/publishable key only; never read a service-role or secret key here.
- Keep all table/RPC calls behind named operations so apps do not duplicate queries.
- Preserve RLS as the authorization boundary and never trust a role sent by a client.
- Keep server-only orchestration, administrative bypasses and promotion scripts in
  `@precoperto/backend`.
- Do not import Next.js, React Native, Node-only modules or `server-only` here.
- Add tests for cursor mapping, asset paths and pure operation input normalization.
