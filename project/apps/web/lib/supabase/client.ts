'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@precoperto/types';
import { getPublicSupabaseEnv } from '@/lib/env';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createSupabaseBrowserClient() {
  if (!browserClient) {
    const { url, anonKey } = getPublicSupabaseEnv();
    browserClient = createBrowserClient<Database>(url, anonKey);
  }
  return browserClient;
}
