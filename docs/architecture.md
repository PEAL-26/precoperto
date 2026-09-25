# PrecoPerto architecture

## Boundaries

```text
apps/web (Next.js)
  ├─ client components / routes
  ├─ @supabase/ssr request-scoped clients
  └─ @precoperto/backend (server only)

apps/mobile (Expo)
  ├─ Expo Router screens
  ├─ @precoperto/supabase (client safe)
  └─ shared types/schemas/utils

packages/backend (server only)
  ├─ named Supabase operations
  ├─ server-side error mapping
  └─ service-role admin promotion CLI

packages/supabase (client safe)
  ├─ public browser/native client
  ├─ RLS-backed table/RPC operations
  └─ Storage helpers
```

The backend package is never imported by the mobile app or a browser Client
Component. Service-role credentials are only read by server-side code.

## Database

- `users.auth_user_id` references `auth.users.id`; all domain primary keys are
  CUID-shaped text values.
- `stores.location` is a generated PostGIS `geography(Point, 4326)` and has a GIST
  index. Longitude is the X coordinate.
- `search_products` ranks exact/prefix/word/name/description-category matches and
  then distance when coordinates are supplied. It returns a keyset cursor based on
  `(relevance_rank, distance_meters, product_cuid)`.
- Public RPCs explicitly filter active products and redact private-store contact and
  exact-location fields. RLS remains the primary authorization boundary.
- Store bootstrap is idempotent and creates seven closed StoreHours rows.

## Remote validation

The local execution environment does not provide a working Supabase CLI target, so
runtime credentials point to a user-created remote project. CI uses a disposable
local Supabase stack for migration/RLS checks and never uses production secrets.
