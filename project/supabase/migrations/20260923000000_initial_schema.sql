-- PrecoPerto V1: extensions, domain types and core tables.
-- All public identifiers use application-generated CUID-shaped text values.

create schema if not exists extensions;
create schema if not exists private;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create type public.user_role as enum ('admin', 'user');
create type public.product_type as enum ('product', 'service');
create type public.product_status as enum ('active', 'inactive', 'archived');

create or replace function private.base36_from_hex(p_hex text)
returns text
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  v_number numeric := 0;
  v_digit integer;
  v_index integer;
  v_result text := '';
  v_alphabet constant text := '0123456789abcdefghijklmnopqrstuvwxyz';
begin
  for v_index in 1..length(p_hex) loop
    v_digit := strpos('0123456789abcdef', substr(p_hex, v_index, 1)) - 1;
    v_number := v_number * 16 + v_digit;
  end loop;

  if v_number = 0 then
    return '0';
  end if;

  while v_number > 0 loop
    v_result := substr(v_alphabet, (v_number % 36)::integer + 1, 1) || v_result;
    v_number := floor(v_number / 36);
  end loop;

  return v_result;
end;
$$;

-- CUID2-style opaque, URL-safe identifiers. The SHA-256 random source avoids
-- collisions while keeping the identifier independent from Supabase Auth UUIDs.
create or replace function public.generate_cuid()
returns text
language sql
volatile
as $$
  select 'c' || right(
    private.base36_from_hex(
      encode(extensions.digest(extensions.gen_random_bytes(12), 'sha256'), 'hex')
    ),
    23
  );
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- The ownership helpers in this file read the tables below, so they are created
-- after them. PostgreSQL validates `language sql` bodies at creation time.

create table if not exists public.users (
  cuid text primary key default public.generate_cuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  email text not null check (char_length(trim(email)) between 3 and 320),
  role public.user_role not null default 'user',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists users_email_lower_idx on public.users (lower(email));
create index if not exists users_auth_user_id_idx on public.users (auth_user_id);

create table if not exists public.stores (
  cuid text primary key default public.generate_cuid(),
  user_cuid text not null unique references public.users(cuid) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  description text,
  avatar text,
  cover text,
  address text,
  city text,
  province text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  phone text,
  whatsapp text,
  email text,
  website text,
  social_links jsonb not null default '{}'::jsonb
    check (jsonb_typeof(social_links) = 'object'),
  is_private boolean not null default false,
  location extensions.geography(Point, 4326)
    generated always as (
      extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography
    ) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists stores_location_gist_idx on public.stores using gist (location);
create index if not exists stores_user_cuid_idx on public.stores (user_cuid);
create index if not exists stores_private_idx on public.stores (is_private);

create table if not exists public.categories (
  cuid text primary key default public.generate_cuid(),
  name text not null check (char_length(trim(name)) between 1 and 100),
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists categories_name_lower_idx on public.categories (lower(name));
create index if not exists categories_name_trgm_idx on public.categories using gin (name extensions.gin_trgm_ops);

create table if not exists public.products (
  cuid text primary key default public.generate_cuid(),
  store_cuid text not null references public.stores(cuid) on delete restrict,
  category_cuid text not null references public.categories(cuid) on delete restrict,
  type public.product_type not null,
  name text not null check (char_length(trim(name)) between 1 and 180),
  price numeric(14, 2) not null check (price >= 0),
  currency text not null default 'AOA' check (currency = 'AOA'),
  description text,
  cover text,
  status public.product_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists products_store_status_idx on public.products (store_cuid, status, updated_at desc, cuid);
create index if not exists products_category_idx on public.products (category_cuid);
create index if not exists products_status_idx on public.products (status);
create index if not exists products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops);

create table if not exists public.store_hours (
  cuid text primary key default public.generate_cuid(),
  store_cuid text not null references public.stores(cuid) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_closed boolean not null default true,
  open_time time,
  close_time time,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint store_hours_day_unique unique (store_cuid, day_of_week),
  constraint store_hours_open_values check (
    is_closed or (open_time is not null and close_time is not null and open_time < close_time)
  )
);

create index if not exists store_hours_store_day_idx on public.store_hours (store_cuid, day_of_week);

-- Ownership and role helpers. These are security definer so that RLS policies can
-- resolve ownership without granting recursive read access to the clients.

create or replace function private.current_user_cuid()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.cuid
  from public.users as u
  where u.auth_user_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users as u
    where u.auth_user_id = (select auth.uid())
      and u.role = 'admin'
  );
$$;

create or replace function private.is_store_owner(p_store_cuid text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.stores as s
    join public.users as u on u.cuid = s.user_cuid
    where s.cuid = p_store_cuid
      and u.auth_user_id = (select auth.uid())
  );
$$;

create or replace function private.is_product_owner(p_product_cuid text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.products as p
    where p.cuid = p_product_cuid
      and private.is_store_owner(p.store_cuid)
  );
$$;

create or replace trigger users_set_updated_at
before update on public.users
for each row execute function private.set_updated_at();

create or replace trigger stores_set_updated_at
before update on public.stores
for each row execute function private.set_updated_at();

create or replace trigger categories_set_updated_at
before update on public.categories
for each row execute function private.set_updated_at();

create or replace trigger products_set_updated_at
before update on public.products
for each row execute function private.set_updated_at();

create or replace trigger store_hours_set_updated_at
before update on public.store_hours
for each row execute function private.set_updated_at();
