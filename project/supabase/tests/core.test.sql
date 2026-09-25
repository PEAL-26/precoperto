begin;
select plan(22);

select has_table('public', 'users', 'users table exists');
select has_table('public', 'stores', 'stores table exists');
select has_table('public', 'products', 'products table exists');
select has_table('public', 'categories', 'categories table exists');
select has_table('public', 'store_hours', 'store_hours table exists');

select ok((select rowsecurity from pg_class where oid = 'public.users'::regclass), 'users has RLS enabled');
select ok((select rowsecurity from pg_class where oid = 'public.stores'::regclass), 'stores has RLS enabled');
select ok((select rowsecurity from pg_class where oid = 'public.products'::regclass), 'products has RLS enabled');
select ok((select rowsecurity from pg_class where oid = 'public.categories'::regclass), 'categories has RLS enabled');
select ok((select rowsecurity from pg_class where oid = 'public.store_hours'::regclass), 'store_hours has RLS enabled');

select ok(
  exists (select 1 from pg_extension where extname = 'postgis'),
  'PostGIS is enabled'
);

select ok(public.generate_cuid() ~ '^c[0-9a-z]{23,}$', 'generated identifiers are CUID-shaped');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@example.com', extensions.crypt('password', extensions.gen_salt('bf')), now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'other@example.com', extensions.crypt('password', extensions.gen_salt('bf')), now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.users (cuid, auth_user_id, name, email) values
  ('cowner000000000000000000001', '11111111-1111-1111-1111-111111111111', 'Owner', 'owner@example.com'),
  ('cother000000000000000000002', '22222222-2222-2222-2222-222222222222', 'Other', 'other@example.com');

insert into public.categories (cuid, name) values ('ccategory00000000000000001', 'Alimentação');
insert into public.stores (cuid, user_cuid, name, latitude, longitude, is_private) values
  ('cstore00000000000000000001', 'cowner000000000000000000001', 'Loja do Owner', -8.83, 13.23, false),
  ('cstore00000000000000000002', 'cother000000000000000000002', 'Loja Privada', -8.84, 13.24, true);
insert into public.products (cuid, store_cuid, category_cuid, type, name, price, currency, status) values
  ('cproduct000000000000000001', 'cstore00000000000000000001', 'ccategory00000000000000001', 'product', 'Arroz 5kg', 6500, 'AOA', 'active'),
  ('cproduct000000000000000002', 'cstore00000000000000000002', 'ccategory00000000000000001', 'product', 'Arroz 5kg', 6800, 'AOA', 'active'),
  ('cproduct000000000000000003', 'cstore00000000000000000001', 'ccategory00000000000000001', 'product', 'Arroz inactivo', 7000, 'AOA', 'inactive');

set local role anon;
select is((select count(*) from public.search_products('arroz')), 2::bigint, 'anonymous search returns only active products, including private-store products');
select is_null((select public.get_public_store('cstore00000000000000000002')), 'anonymous cannot read a private store directly');
select throws_ok($$insert into public.categories (name) values ('Não permitido')$$, '42501', null, 'anonymous cannot create categories');
select is_null(
  public.get_product_details('cproduct000000000000000002', -8.83, 13.23) ->> 'distance_meters',
  'anonymous product details hide the distance of private stores'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select is((select count(*) from public.products), 3::bigint, 'owner can read own active and inactive products');
select is((select count(*) from public.stores), 2::bigint, 'owner can read public stores and own private stores');
select lives_ok($$update public.stores set name = 'Loja Actualizada' where cuid = 'cstore00000000000000000001'$$, 'owner can update own store');
select throws_ok($$insert into public.users (auth_user_id, name, email, role) values ('11111111-1111-1111-1111-111111111111', 'Escalated', 'owner@example.com', 'admin')$$, '42501', null, 'users cannot self-assign admin role');
select ok(
  (public.get_product_details('cproduct000000000000000001', -8.83, 13.23) ->> 'distance_meters')::double precision between 0 and 5000,
  'product details return a database-computed distance'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select is_empty($$update public.stores set name = 'Invadido' where cuid = 'cstore00000000000000000001' returning cuid$$, 'non-owner cannot update another store');

select * from finish();
rollback;
