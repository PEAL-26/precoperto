-- PrecoPerto V1: optional image buckets and owner-scoped Storage policies.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('store-assets', 'store-assets', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('product-assets', 'product-assets', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.can_write_store_asset(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.stores as store
    where (storage.foldername(p_name))[1] = store.cuid
      and private.is_store_owner(store.cuid)
  );
$$;

create or replace function private.can_write_product_asset(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.products as product
    where (storage.foldername(p_name))[1] = product.store_cuid
      and (storage.foldername(p_name))[2] = product.cuid
      and private.is_store_owner(product.store_cuid)
  );
$$;

revoke execute on function private.can_write_store_asset(text) from public;
revoke execute on function private.can_write_product_asset(text) from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_store_owner(text) to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.can_write_store_asset(text) to authenticated;
grant execute on function private.can_write_product_asset(text) to authenticated;

create policy store_assets_public_read on storage.objects
for select to anon, authenticated
using (bucket_id = 'store-assets');

create policy product_assets_public_read on storage.objects
for select to anon, authenticated
using (bucket_id = 'product-assets');

create policy store_assets_owner_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'store-assets' and (select private.can_write_store_asset(name)));

create policy store_assets_owner_update on storage.objects
for update to authenticated
using (bucket_id = 'store-assets' and (select private.can_write_store_asset(name)))
with check (bucket_id = 'store-assets' and (select private.can_write_store_asset(name)));

create policy store_assets_owner_delete on storage.objects
for delete to authenticated
using (bucket_id = 'store-assets' and (select private.can_write_store_asset(name)));

create policy product_assets_owner_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'product-assets' and (select private.can_write_product_asset(name)));

create policy product_assets_owner_update on storage.objects
for update to authenticated
using (bucket_id = 'product-assets' and (select private.can_write_product_asset(name)))
with check (bucket_id = 'product-assets' and (select private.can_write_product_asset(name)));

create policy product_assets_owner_delete on storage.objects
for delete to authenticated
using (bucket_id = 'product-assets' and (select private.can_write_product_asset(name)));
