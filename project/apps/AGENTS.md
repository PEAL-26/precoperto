# Application workspaces

- `web/` and `mobile/` are independently buildable applications.
- Keep app-specific UI and routing inside the app; move only platform-neutral logic to
  `packages/`.
- Do not import a server-only package from a Client Component or Expo bundle.
- Each app owns its own styling, platform APIs and tests.
