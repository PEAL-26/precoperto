import { NextResponse } from 'next/server';
import { bootstrapProfileSchema } from '@precoperto/schemas';
import { bootstrapApplication } from '@precoperto/backend';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bootstrapProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 },
    );
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user)
      return NextResponse.json({ message: 'SessãoRequired.' }, { status: 401 });
    const result = await bootstrapApplication(supabase, {
      ...parsed.data,
      email: data.user.email ?? parsed.data.email,
    });
    if (result.error) return NextResponse.json({ message: result.error.message }, { status: 400 });
    return NextResponse.json({ message: 'Perfil concluído.', data: result.data });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Não foi possível concluir o perfil.' },
      { status: 500 },
    );
  }
}
