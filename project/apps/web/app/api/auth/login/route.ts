import { NextResponse } from 'next/server';
import { loginSchema } from '@precoperto/schemas';
import { signInWithEmail } from '@precoperto/backend';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 },
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await signInWithEmail(supabase, parsed.data);
    if (error)
      return NextResponse.json({ message: 'Email ou password incorrectos.' }, { status: 401 });
    return NextResponse.json({ message: 'Sessão iniciada.' });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Não foi possível entrar.' },
      { status: 500 },
    );
  }
}
