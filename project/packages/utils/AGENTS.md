# Utils package conventions

- Keep every helper pure and platform-neutral; do not access `window`, `document`,
  `localStorage`, React Native APIs or Node APIs.
- Prefer deterministic functions with explicit inputs and no hidden global state.
- Keep formatting locale-aware, but preserve Portuguese UI copy in the caller when
  a message is not a locale-formatting concern.
- Add unit tests for edge cases, invalid coordinates, cursor parsing and rounding.
- Do not add UI components or Supabase clients here.
