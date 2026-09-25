import { NextResponse } from 'next/server';
import { signOut } from '@precoperto/backend';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await signOut(supabase);
  } catch {
    // Logout should still redirect the user if the session is already gone.
  }
  return NextResponse.redirect(
    new URL('/', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  );
}
