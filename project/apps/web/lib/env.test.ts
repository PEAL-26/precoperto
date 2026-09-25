import { afterEach, describe, expect, it } from 'vitest';
import { getPublicSupabaseEnv, hasPublicSupabaseEnv } from './env';

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const originalPublishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

afterEach(() => {
  restoreEnv('NEXT_PUBLIC_SUPABASE_URL', originalUrl);
  restoreEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', originalAnon);
  restoreEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', originalPublishable);
});

describe('web Supabase environment', () => {
  it('accepts the legacy anon key name required by the specification', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    expect(hasPublicSupabaseEnv()).toBe(true);
    expect(getPublicSupabaseEnv()).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
    });
  });

  it('rejects missing configuration', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    expect(hasPublicSupabaseEnv()).toBe(false);
    expect(() => getPublicSupabaseEnv()).toThrow('Configuração do Supabase em falta');
  });
});
