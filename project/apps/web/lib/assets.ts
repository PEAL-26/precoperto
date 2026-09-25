import { createPublicSupabaseClient, getPublicAssetUrl } from '@precoperto/supabase';
import { getPublicSupabaseEnv } from '@/lib/env';

export function getAssetUrl(
  path: string | null | undefined,
  bucket: 'store-assets' | 'product-assets',
) {
  if (!path) return null;
  try {
    const env = getPublicSupabaseEnv();
    const client = createPublicSupabaseClient(env);
    return getPublicAssetUrl(client, bucket, path);
  } catch {
    return null;
  }
}
