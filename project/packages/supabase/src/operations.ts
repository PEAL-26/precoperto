import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Category,
  Database,
  Json,
  Product,
  SearchCursor,
  SearchProduct,
  Store,
  StoreHours,
  User,
} from '@precoperto/types';
import { decodeSearchCursor, encodeSearchCursor } from '@precoperto/utils';

export type DataClient = SupabaseClient<Database>;

export interface SearchProductsInput {
  search?: string;
  latitude?: number;
  longitude?: number;
  cursor?: string | SearchCursor | null;
  limit?: number;
}

export interface DashboardData {
  user: User;
  store: Store;
  hours: StoreHours[];
  products: Product[];
  categories: Category[];
}

export async function searchProducts(client: DataClient, input: SearchProductsInput = {}) {
  const cursor =
    typeof input.cursor === 'string' ? decodeSearchCursor(input.cursor) : (input.cursor ?? null);
  return client.rpc('search_products', {
    p_search: input.search?.trim() || null,
    p_latitude: input.latitude ?? null,
    p_longitude: input.longitude ?? null,
    p_cursor_rank: cursor?.relevanceRank ?? null,
    p_cursor_distance: cursor?.distanceMeters ?? null,
    p_cursor_id: cursor?.cuid ?? null,
    p_limit: input.limit ?? 24,
  });
}

export function getNextSearchCursor(items: SearchProduct[]) {
  const last = items.at(-1);
  if (!last) return null;
  return encodeSearchCursor({
    relevanceRank: last.relevance_rank,
    distanceMeters: last.distance_meters,
    cuid: last.product_cuid,
  });
}

export async function bootstrapApplication(
  client: DataClient,
  input: { name: string; email: string; latitude: number; longitude: number },
) {
  return client.rpc('bootstrap_application', {
    p_name: input.name,
    p_email: input.email,
    p_latitude: input.latitude,
    p_longitude: input.longitude,
  });
}

export interface ProductDetailsCoordinates {
  latitude?: number | null;
  longitude?: number | null;
}

export async function getProductDetails(
  client: DataClient,
  productCuid: string,
  coordinates: ProductDetailsCoordinates = {},
) {
  return client.rpc('get_product_details', {
    p_product_cuid: productCuid,
    p_latitude: coordinates.latitude ?? null,
    p_longitude: coordinates.longitude ?? null,
  });
}

export async function getPublicStore(client: DataClient, storeCuid: string) {
  return client.rpc('get_public_store', { p_store_cuid: storeCuid });
}

export async function getStoreCatalog(client: DataClient, storeCuid: string) {
  return client.rpc('get_store_catalog', { p_store_cuid: storeCuid });
}

export async function getDashboard(client: DataClient): Promise<{
  data: DashboardData | null;
  error: { message: string } | null;
}> {
  const {
    data: { user: authUser },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !authUser) return { data: null, error: authError };

  const { data: user, error: userError } = await client
    .from('users')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .single();
  if (userError || !user) return { data: null, error: userError };

  const { data: store, error: storeError } = await client
    .from('stores')
    .select('*')
    .eq('user_cuid', user.cuid)
    .single();
  if (storeError || !store) {
    return { data: null, error: storeError ?? { message: 'Estabelecimento não encontrado.' } };
  }

  const [
    { data: hours, error: hoursError },
    { data: products, error: productsError },
    { data: categories, error: categoriesError },
  ] = await Promise.all([
    client.from('store_hours').select('*').eq('store_cuid', store.cuid).order('day_of_week'),
    client
      .from('products')
      .select('*')
      .eq('store_cuid', store.cuid)
      .order('updated_at', { ascending: false }),
    client.from('categories').select('*').order('name'),
  ]);

  const dashboardStore = store ?? undefined;
  if (!dashboardStore || storeError || hoursError || productsError || categoriesError) {
    return {
      data: null,
      error: storeError ??
        hoursError ??
        productsError ??
        categoriesError ?? { message: 'Perfil não encontrado.' },
    };
  }

  return {
    data: {
      user,
      store: dashboardStore,
      hours: hours ?? [],
      products: products ?? [],
      categories: categories ?? [],
    },
    error: null,
  };
}

export async function updateStore(client: DataClient, storeCuid: string, values: Partial<Store>) {
  return client.from('stores').update(values).eq('cuid', storeCuid).select('*').single();
}

export async function upsertStoreHours(
  client: DataClient,
  storeCuid: string,
  values: Array<{
    day_of_week: number;
    is_closed?: boolean;
    open_time?: string | null;
    close_time?: string | null;
  }>,
) {
  const rows = values.map((value) => ({ ...value, store_cuid: storeCuid }));
  return client
    .from('store_hours')
    .upsert(rows, { onConflict: 'store_cuid,day_of_week' })
    .select('*');
}

export async function createProduct(
  client: DataClient,
  values: Partial<Product> &
    Pick<Product, 'name' | 'type' | 'category_cuid' | 'price' | 'currency'>,
) {
  return client.from('products').insert(values).select('*').single();
}

export async function updateProduct(
  client: DataClient,
  productCuid: string,
  values: Partial<Product>,
) {
  return client.from('products').update(values).eq('cuid', productCuid).select('*').single();
}

export async function listCategories(client: DataClient) {
  return client.from('categories').select('*').order('name');
}

export async function createCategory(
  client: DataClient,
  values: { name: string; description?: string | null },
) {
  return client.from('categories').insert(values).select('*').single();
}

export async function updateCategory(
  client: DataClient,
  categoryCuid: string,
  values: { name?: string; description?: string | null },
) {
  return client.from('categories').update(values).eq('cuid', categoryCuid).select('*').single();
}

export async function deleteCategory(client: DataClient, categoryCuid: string) {
  return client.from('categories').delete().eq('cuid', categoryCuid).select('cuid').single();
}

export async function uploadAsset(
  client: DataClient,
  bucket: 'store-assets' | 'product-assets',
  path: string,
  body: unknown,
  contentType?: string,
) {
  return client.storage.from(bucket).upload(path, body as never, {
    cacheControl: '3600',
    contentType,
    upsert: true,
  });
}

export function getPublicAssetUrl(
  client: DataClient,
  bucket: 'store-assets' | 'product-assets',
  path: string | null | undefined,
) {
  if (!path) return null;
  return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export function asJson(value: unknown): Json {
  return (value ?? null) as Json;
}
