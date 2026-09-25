import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@precoperto/types';

export interface PublicSupabaseConfig {
  url: string;
  anonKey: string;
}

export function assertSupabaseConfig(config: PublicSupabaseConfig) {
  if (!config.url || !config.anonKey) {
    throw new Error('Configuração do Supabase em falta.');
  }
  if (!/^https?:\/\//i.test(config.url)) {
    throw new Error('URL do Supabase inválida.');
  }
}

export function createPublicSupabaseClient(config: PublicSupabaseConfig) {
  assertSupabaseConfig(config);
  return createClient<Database>(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });
}

export type PublicSupabaseClient = SupabaseClient<Database>;
