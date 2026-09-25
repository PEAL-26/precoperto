# Mobile app conventions

- Use Expo SDK-compatible packages installed with `pnpm exec expo install`; do not
  independently upgrade React Native or native modules.
- Use Expo Router file-based routes and keep route files thin; put reusable UI and
  business orchestration in `components/` and `lib/`.
- Reuse only platform-neutral code from `packages/types`, `packages/schemas`,
  `packages/utils` and `packages/supabase`; never import `@precoperto/backend`.
- Use `@supabase/supabase-js` with a platform storage adapter and public Supabase
  configuration only. Do not put secrets in `EXPO_PUBLIC_*` variables.
- Request foreground location only when needed and handle denied/unavailable states.
- Use React Native primitives for shared UI; do not import web CSS, DOM components or
  Next.js modules.
- Use a bottom-sheet/modal presentation for create/edit forms on mobile.
- Keep Portuguese user-facing copy and English identifiers.
- Test pure helpers and auth/location boundaries with Jest + React Native Testing
  Library; keep tests outside the `app/` route directory.
- Validate at least the web export and TypeScript before considering a native build
  complete; native builds require the platform toolchain.
