# Schemas package conventions

- Keep schemas platform-neutral and dependency-light.
- All validation messages exposed to users must be in Portuguese.
- Keep field names aligned with the database and shared types.
- Use `.trim()`, coercion and explicit bounds at external input boundaries.
- Add a test for every conditional or cross-field validation rule.
- Do not import React, Next.js, Expo, Supabase or Node APIs here.
