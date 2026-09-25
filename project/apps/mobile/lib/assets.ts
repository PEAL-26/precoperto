import { getMobileSupabaseClient } from '@/lib/supabase';
import { getPublicAssetUrl } from '@precoperto/supabase';

export function getMobileAssetUrl(
  bucket: 'store-assets' | 'product-assets',
  path: string | null | undefined,
) {
  if (!path) return null;
  try {
    return getPublicAssetUrl(getMobileSupabaseClient(), bucket, path);
  } catch {
    return null;
  }
}
