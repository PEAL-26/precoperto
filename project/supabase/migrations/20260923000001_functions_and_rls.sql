-- PrecoPerto V1: idempotent registration bootstrap, search RPCs and RLS.

create or replace function public.bootstrap_application(
  p_name text,
  p_email text,
  p_latitude double precision,
  p_longitude double precision
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth_user_id uuid := (select auth.uid());
  v_auth_email text;
  v_name text := nullif(trim(p_name), '');
  v_user_cuid text;
  v_store_cuid text;
  v_created boolean := false;
begin
  if v_auth_user_id is null then
    raise exception 'É necessário iniciar sessão.' using errcode = '42501';
  end if;
  if v_name is null or p_latitude is null or p_longitude is null then
    raise exception 'Nome e localização são obrigatórios.' using errcode = '22023';
  end if;
  if p_latitude < -90 or p_latitude > 90 or p_longitude < -180 or p_longitude > 180 then
    raise exception 'Localização inválida.' using errcode = '22023';
  end if;

  select lower(u.email)
    into v_auth_email
    from auth.users as u
   where u.id = v_auth_user_id;

  if v_auth_email is null then
    raise exception 'Email de autenticação não encontrado.' using errcode = 'P0002';
  end if;

  select app_user.cuid
    into v_user_cuid
    from public.users as app_user
   where app_user.auth_user_id = v_auth_user_id;

  if v_user_cuid is null then
    insert into public.users (auth_user_id, name, email)
    values (v_auth_user_id, v_name, v_auth_email)
    returning cuid into v_user_cuid;
    v_created := true;
  else
    update public.users
       set name = v_name,
           email = v_auth_email
     where cuid = v_user_cuid;
  end if;

  select store.cuid
    into v_store_cuid
    from public.stores as store
   where store.user_cuid = v_user_cuid;

  if v_store_cuid is null then
    insert into public.stores (user_cuid, name, latitude, longitude, is_private)
    values (v_user_cuid, v_name, p_latitude, p_longitude, false)
    returning cuid into v_store_cuid;
  end if;

  insert into public.store_hours (store_cuid, day_of_week, is_closed)
  select v_store_cuid, day_number, true
    from generate_series(0, 6) as day_number
  on conflict (store_cuid, day_of_week) do nothing;

  return jsonb_build_object(
    'user_cuid', v_user_cuid,
    'store_cuid', v_store_cuid,
    'created', v_created
  );
end;
$$;

create or replace function public.search_products(
  p_search text default null,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_cursor_rank integer default null,
  p_cursor_distance double precision default null,
  p_cursor_id text default null,
  p_limit integer default 24
)
returns table (
  product_cuid text,
  store_cuid text,
  type public.product_type,
  name text,
  price numeric,
  currency text,
  description text,
  cover text,
  status public.product_status,
  category_name text,
  store_name text,
  store_is_private boolean,
  store_city text,
  store_province text,
  store_address text,
  store_phone text,
  store_whatsapp text,
  store_website text,
  store_social_links jsonb,
  store_latitude double precision,
  store_longitude double precision,
  distance_meters double precision,
  relevance_rank integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with params as (
    select lower(trim(coalesce(p_search, ''))) as query,
           case when p_latitude is not null and p_longitude is not null
                then true else false end as has_location,
           greatest(1, least(50, coalesce(p_limit, 24))) as page_size
  ), ranked as (
    select
      product.cuid as product_cuid,
      product.store_cuid,
      product.type,
      product.name,
      product.price,
      product.currency,
      product.description,
      product.cover,
      product.status,
      category.name as category_name,
      store.name as store_name,
      store.is_private as store_is_private,
      case when store.is_private and not private.is_store_owner(store.cuid) then null else store.city end as store_city,
      case when store.is_private and not private.is_store_owner(store.cuid) then null else store.province end as store_province,
      case when store.is_private and not private.is_store_owner(store.cuid) then null else store.address end as store_address,
      case when store.is_private and not private.is_store_owner(store.cuid) then null else store.phone end as store_phone,
      case when store.is_private and not private.is_store_owner(store.cuid) then null else store.whatsapp end as store_whatsapp,
      case when store.is_private and not private.is_store_owner(store.cuid) then null else store.website end as store_website,
      case when store.is_private and not private.is_store_owner(store.cuid) then '{}'::jsonb else store.social_links end as store_social_links,
      case when store.is_private and not private.is_store_owner(store.cuid) then null else store.latitude end as store_latitude,
      case when store.is_private and not private.is_store_owner(store.cuid) then null else store.longitude end as store_longitude,
      case
        when params.has_location then
          extensions.st_distance(
            store.location,
            extensions.st_point(p_longitude, p_latitude)::extensions.geography
          )
        else null
      end as distance_meters,
      case
        when params.query = '' then 0
        when lower(trim(product.name)) = params.query then 0
        when lower(trim(product.name)) like params.query || '%' then 1
        when exists (
          select 1
          from unnest(string_to_array(lower(trim(product.name)), ' ')) as word
          where word like params.query || '%'
        ) then 2
        when lower(product.name) like '%' || params.query || '%' then 3
        when lower(coalesce(product.description, '')) like '%' || params.query || '%'
          or lower(category.name) like '%' || params.query || '%' then 4
        else 5
      end as relevance_rank
    from public.products as product
    join public.stores as store on store.cuid = product.store_cuid
    join public.categories as category on category.cuid = product.category_cuid
    cross join params
    where product.status = 'active'
      and (
        params.query = ''
        or lower(product.name) like '%' || params.query || '%'
        or lower(coalesce(product.description, '')) like '%' || params.query || '%'
        or lower(category.name) like '%' || params.query || '%'
      )
  )
  select
    ranked.product_cuid,
    ranked.store_cuid,
    ranked.type,
    ranked.name,
    ranked.price,
    ranked.currency,
    ranked.description,
    ranked.cover,
    ranked.status,
    ranked.category_name,
    ranked.store_name,
    ranked.store_is_private,
    ranked.store_city,
    ranked.store_province,
    ranked.store_address,
    ranked.store_phone,
    ranked.store_whatsapp,
    ranked.store_website,
    ranked.store_social_links,
    ranked.store_latitude,
    ranked.store_longitude,
    ranked.distance_meters,
    ranked.relevance_rank
  from ranked
  where
    p_cursor_id is null
    or (
      ranked.relevance_rank < p_cursor_rank
      or (
        ranked.relevance_rank = p_cursor_rank
        and (
          (p_cursor_distance is null and ranked.distance_meters is null and ranked.product_cuid > p_cursor_id)
          or (p_cursor_distance is not null and ranked.distance_meters is not null and ranked.distance_meters > p_cursor_distance)
          or (p_cursor_distance is not null and ranked.distance_meters = p_cursor_distance and ranked.product_cuid > p_cursor_id)
        )
      )
    )
  order by
    ranked.relevance_rank asc,
    coalesce(ranked.distance_meters, 1000000000::double precision) asc,
    ranked.product_cuid asc
  limit (select page_size from params);
$$;

create or replace function public.get_product_details(p_product_cuid text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
  v_store public.stores%rowtype;
  v_category public.categories%rowtype;
  v_can_view_full_store boolean;
begin
  select * into v_product from public.products where cuid = p_product_cuid;
  if not found then
    return null;
  end if;
  if v_product.status <> 'active' and not private.is_store_owner(v_product.store_cuid) then
    return null;
  end if;

  select * into v_store from public.stores where cuid = v_product.store_cuid;
  select * into v_category from public.categories where cuid = v_product.category_cuid;
  v_can_view_full_store := not v_store.is_private or private.is_store_owner(v_store.cuid);

  return jsonb_build_object(
    'product', jsonb_build_object(
      'cuid', v_product.cuid,
      'store_cuid', v_product.store_cuid,
      'category_cuid', v_product.category_cuid,
      'type', v_product.type,
      'name', v_product.name,
      'price', v_product.price,
      'currency', v_product.currency,
      'description', v_product.description,
      'cover', v_product.cover,
      'status', v_product.status,
      'created_at', v_product.created_at,
      'updated_at', v_product.updated_at
    ),
    'category', jsonb_build_object('cuid', v_category.cuid, 'name', v_category.name, 'description', v_category.description),
    'store', jsonb_build_object(
      'cuid', v_store.cuid,
      'name', v_store.name,
      'is_private', v_store.is_private,
      'description', case when v_can_view_full_store then v_store.description else null end,
      'avatar', case when v_can_view_full_store then v_store.avatar else null end,
      'cover', case when v_can_view_full_store then v_store.cover else null end,
      'address', case when v_can_view_full_store then v_store.address else null end,
      'city', case when v_can_view_full_store then v_store.city else null end,
      'province', case when v_can_view_full_store then v_store.province else null end,
      'phone', case when v_can_view_full_store then v_store.phone else null end,
      'whatsapp', case when v_can_view_full_store then v_store.whatsapp else null end,
      'email', case when v_can_view_full_store then v_store.email else null end,
      'website', case when v_can_view_full_store then v_store.website else null end,
      'social_links', case when v_can_view_full_store then v_store.social_links else '{}'::jsonb end,
      'latitude', case when v_can_view_full_store then v_store.latitude else null end,
      'longitude', case when v_can_view_full_store then v_store.longitude else null end
    ),
    'hours', case when v_can_view_full_store then (
      select coalesce(jsonb_agg(to_jsonb(h) order by h.day_of_week), '[]'::jsonb)
      from public.store_hours as h
      where h.store_cuid = v_store.cuid
    ) else null end
  );
end;
$$;

create or replace function public.get_public_store(p_store_cuid text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_store public.stores%rowtype;
begin
  select * into v_store from public.stores where cuid = p_store_cuid;
  if not found then
    return null;
  end if;
  if v_store.is_private and not private.is_store_owner(v_store.cuid) then
    return null;
  end if;

  return jsonb_build_object(
    'cuid', v_store.cuid,
    'user_cuid', v_store.user_cuid,
    'name', v_store.name,
    'description', v_store.description,
    'avatar', v_store.avatar,
    'cover', v_store.cover,
    'address', v_store.address,
    'city', v_store.city,
    'province', v_store.province,
    'latitude', v_store.latitude,
    'longitude', v_store.longitude,
    'phone', v_store.phone,
    'whatsapp', v_store.whatsapp,
    'email', v_store.email,
    'website', v_store.website,
    'social_links', v_store.social_links,
    'is_private', v_store.is_private,
    'created_at', v_store.created_at,
    'updated_at', v_store.updated_at,
    'hours', (
      select coalesce(jsonb_agg(to_jsonb(h) order by h.day_of_week), '[]'::jsonb)
      from public.store_hours as h
      where h.store_cuid = v_store.cuid
    )
  );
end;
$$;

create or replace function public.get_store_catalog(p_store_cuid text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_store public.stores%rowtype;
begin
  select * into v_store from public.stores where cuid = p_store_cuid;
  if not found or (v_store.is_private and not private.is_store_owner(v_store.cuid)) then
    return null;
  end if;

  return jsonb_build_object(
    'products', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'cuid', product.cuid,
          'store_cuid', product.store_cuid,
          'category_cuid', product.category_cuid,
          'category_name', category.name,
          'type', product.type,
          'name', product.name,
          'price', product.price,
          'currency', product.currency,
          'description', product.description,
          'cover', product.cover,
          'status', product.status
        ) order by product.updated_at desc
      )
      from public.products as product
      join public.categories as category on category.cuid = product.category_cuid
      where product.store_cuid = v_store.cuid
        and product.status = 'active'
    ), '[]'::jsonb)
  );
end;
$$;

-- Privileges: policies are not enough; client roles receive only the operations
-- they are intended to use.
revoke all on schema private from public;
revoke execute on function private.current_user_cuid() from public;
revoke execute on function private.is_admin() from public;
revoke execute on function private.is_store_owner(text) from public;
revoke execute on function private.is_product_owner(text) from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.current_user_cuid() to authenticated;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.is_store_owner(text) to anon, authenticated;
grant execute on function private.is_product_owner(text) to authenticated;

revoke all on public.users from anon, authenticated;
grant select on public.users to authenticated;
grant insert (auth_user_id, name, email) on public.users to authenticated;
grant update (name, email) on public.users to authenticated;

revoke all on public.stores from anon, authenticated;
grant select on public.stores to anon, authenticated;
grant insert on public.stores to authenticated;
grant update (name, description, avatar, cover, address, city, province, latitude, longitude, phone, whatsapp, email, website, social_links, is_private) on public.stores to authenticated;

revoke all on public.categories from anon, authenticated;
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;

revoke all on public.products from anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert on public.products to authenticated;
grant update (category_cuid, type, name, price, currency, description, cover, status) on public.products to authenticated;

revoke all on public.store_hours from anon, authenticated;
grant select on public.store_hours to anon, authenticated;
grant insert on public.store_hours to authenticated;
grant update (day_of_week, is_closed, open_time, close_time) on public.store_hours to authenticated;

alter table public.users enable row level security;
alter table public.stores enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.store_hours enable row level security;

create policy users_select_own on public.users
for select to authenticated
using ((select auth.uid()) = auth_user_id);

create policy users_insert_own on public.users
for insert to authenticated
with check ((select auth.uid()) = auth_user_id);

create policy users_update_own on public.users
for update to authenticated
using ((select auth.uid()) = auth_user_id)
with check ((select auth.uid()) = auth_user_id);

create policy stores_public_or_owner_read on public.stores
for select to anon, authenticated
using (is_private = false or (select private.is_store_owner(cuid)));

create policy stores_insert_own on public.stores
for insert to authenticated
with check ((select private.current_user_cuid()) = user_cuid);

create policy stores_update_own on public.stores
for update to authenticated
using ((select private.is_store_owner(cuid)))
with check ((select private.is_store_owner(cuid)) and (select private.current_user_cuid()) = user_cuid);

create policy categories_public_read on public.categories
for select to anon, authenticated
using (true);

create policy categories_admin_insert on public.categories
for insert to authenticated
with check ((select private.is_admin()));

create policy categories_admin_update on public.categories
for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy categories_admin_delete on public.categories
for delete to authenticated
using ((select private.is_admin()));

create policy products_public_active_or_owner_read on public.products
for select to anon, authenticated
using (status = 'active' or (select private.is_store_owner(store_cuid)));

create policy products_owner_insert on public.products
for insert to authenticated
with check ((select private.is_store_owner(store_cuid)));

create policy products_owner_update on public.products
for update to authenticated
using ((select private.is_store_owner(store_cuid)))
with check ((select private.is_store_owner(store_cuid)));

create policy store_hours_public_or_owner_read on public.store_hours
for select to anon, authenticated
using (
  exists (
    select 1 from public.stores as store
    where store.cuid = store_hours.store_cuid
      and (store.is_private = false or (select private.is_store_owner(store.cuid)))
  )
);

create policy store_hours_owner_insert on public.store_hours
for insert to authenticated
with check ((select private.is_store_owner(store_cuid)));

create policy store_hours_owner_update on public.store_hours
for update to authenticated
using ((select private.is_store_owner(store_cuid)))
with check ((select private.is_store_owner(store_cuid)));

grant execute on function public.bootstrap_application(text, text, double precision, double precision) to authenticated;
grant execute on function public.search_products(text, double precision, double precision, integer, double precision, text, integer) to anon, authenticated;
grant execute on function public.get_product_details(text) to anon, authenticated;
grant execute on function public.get_public_store(text) to anon, authenticated;
grant execute on function public.get_store_catalog(text) to anon, authenticated;
revoke execute on function public.bootstrap_application(text, text, double precision, double precision) from public;
revoke execute on function public.search_products(text, double precision, double precision, integer, double precision, text, integer) from public;
revoke execute on function public.get_product_details(text) from public;
revoke execute on function public.get_public_store(text) from public;
revoke execute on function public.get_store_catalog(text) from public;
