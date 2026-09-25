import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@precoperto/types';

type AuthClient = SupabaseClient<Database>;
type EmailOtpType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email';

export function signUpWithEmail(
  client: AuthClient,
  input: { email: string; password: string; name: string; latitude: number; longitude: number },
  emailRedirectTo: string,
) {
  return client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo,
      data: {
        name: input.name,
        latitude: input.latitude,
        longitude: input.longitude,
      },
    },
  });
}

export function signInWithEmail(client: AuthClient, input: { email: string; password: string }) {
  return client.auth.signInWithPassword(input);
}

export function signOut(client: AuthClient) {
  return client.auth.signOut();
}

export function verifyEmailOtp(
  client: AuthClient,
  input: { tokenHash: string; type: EmailOtpType },
) {
  return client.auth.verifyOtp({ token_hash: input.tokenHash, type: input.type });
}

export function exchangeCodeForSession(client: AuthClient, code: string) {
  return client.auth.exchangeCodeForSession(code);
}
