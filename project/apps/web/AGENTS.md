# Web app conventions

- Use the Next.js App Router and keep pages focused; move reusable UI into small
  components and data orchestration into route handlers/server helpers.
- Import server-only Supabase orchestration from `@precoperto/backend` only in
  Server Components, Server Actions, Proxy or Route Handlers.
- Use `@supabase/ssr` request-scoped clients; never cache an authenticated client
  globally and never trust `getSession()` for authorization.
- Keep browser data mutations behind route handlers and validate every body with
  `@precoperto/schemas` before calling the backend.
- Keep all visible copy in Portuguese and code identifiers in English.
- Avoid web-only libraries in shared packages; this app may use Next-specific APIs.
- Use the existing CSS tokens and component classes in `app/globals.css` before adding
  a new styling system.
- Treat loading, empty, error, unauthenticated and location-permission-denied states
  as first-class UI states.
- Do not use `dangerouslySetInnerHTML` or render untrusted URLs without validation.
- Keep route handlers thin: validate, authorize, call a named backend operation and
  return a safe JSON response.
- Do not import `@precoperto/backend` from a `'use client'` component.
- Use `proxy.ts` for session refresh; enforce authorization again in pages, route
  handlers and backend operations/RLS.
- Add tests for route validation and critical user-visible states where practical.
