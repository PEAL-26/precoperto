import { NextResponse } from 'next/server';
import { registerSchema } from '@precoperto/schemas';
import { bootstrapApplication, signUpWithEmail } from '@precoperto/backend';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 },
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const origin = request.headers.get('origin') ?? new URL(request.url).origin;
    const { data, error } = await signUpWithEmail(supabase, parsed.data, `${origin}/auth/confirm`);
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (data.session) {
      const bootstrap = await bootstrapApplication(supabase, parsed.data);
      if (bootstrap.error) {
        return NextResponse.json({ message: bootstrap.error.message }, { status: 400 });
      }
    }

    return NextResponse.json({
      message: data.session ? 'Conta criada.' : 'Verifique o email para activar a conta.',
      requiresConfirmation: !data.session,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Não foi possível criar a conta.' },
      { status: 500 },
    );
  }
}
