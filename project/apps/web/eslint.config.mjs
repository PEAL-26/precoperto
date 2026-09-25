import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      // Store and product media lives in a user-owned public Supabase bucket with
      // arbitrary dimensions, so it is served directly instead of through the
      // Next.js image optimizer. Containers keep the aspect ratio in CSS.
      '@next/next/no-img-element': 'off',
    },
  },
  globalIgnores(['.next/**', 'coverage/**', 'next-env.d.ts']),
]);
