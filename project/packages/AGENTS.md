# Shared packages

- Shared packages must be platform-neutral unless a package explicitly documents a
  server-only or browser-only boundary.
- Never add Next.js, Expo, React Native, DOM globals or Node-only APIs to the shared
  contracts/helpers.
- Prefer small pure functions and explicit dependency declarations.
- Add or update the package's `AGENTS.md` when introducing a new boundary.
