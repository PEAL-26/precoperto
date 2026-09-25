import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@precoperto/types';

export interface ServerSupabaseConfig {
  url: string;
  secretKey: string;
}

export function getServerSupabaseConfig(): ServerSupabaseConfig {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) {
    throw new Error(
      'Configuração server-side do Supabase em falta: defina SUPABASE_URL e SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY.',
    );
  }
  return { url, secretKey };
}

export function createServiceSupabaseClient(): SupabaseClient<Database> {
  const { url, secretKey } = getServerSupabaseConfig();
  return createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
