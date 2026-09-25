# Supabase database

The remote Supabase project is the application runtime target. The SQL in this
folder is the reproducible source of truth and can also be validated in an isolated
local Supabase instance when Docker is available.

## Remote deployment

1. Create a Supabase project and enable the email confirmation setting.
2. Put the project URL and publishable/anon key in the web/mobile environment.
3. Keep the secret/service key only in the server environment used by
   `@precoperto/backend`.
4. Apply migrations with the Supabase CLI or SQL editor in filename order.
5. Run `pnpm admin:promote <email>` after the first user registers.

Do not paste credentials into source files or CI logs.
