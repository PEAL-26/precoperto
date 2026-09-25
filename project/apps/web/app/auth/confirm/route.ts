import { NextResponse } from 'next/server';
import { exchangeCodeForSession, verifyEmailOtp } from '@precoperto/backend';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as
    'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email' | null;
  const supabase = await createSupabaseServerClient();
  const result =
    tokenHash && type
      ? await verifyEmailOtp(supabase, { tokenHash, type })
      : code
        ? await exchangeCodeForSession(supabase, code)
        : { error: { message: 'Link de confirmação inválido.' } };

  if (result.error) {
    return NextResponse.redirect(new URL('/login?error=confirmation', request.url));
  }
  return NextResponse.redirect(new URL('/login?confirmed=1', request.url));
}
