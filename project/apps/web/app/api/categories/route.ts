import { NextResponse } from 'next/server';
import { categorySchema } from '@precoperto/schemas';
import { createCategory, getDashboard, toPortugueseError } from '@precoperto/backend';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const parsed = categorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Categoria inválida.' },
      { status: 400 },
    );
  try {
    const supabase = await createSupabaseServerClient();
    const dashboard = await getDashboard(supabase);
    if (dashboard.error || !dashboard.data)
      return NextResponse.json({ message: 'SessãoRequired.' }, { status: 401 });
    if (dashboard.data.user.role !== 'admin')
      return NextResponse.json(
        { message: 'Apenas administradores podem gerir categorias.' },
        { status: 403 },
      );
    const { data, error } = await createCategory(supabase, parsed.data);
    if (error) return NextResponse.json({ message: toPortugueseError(error) }, { status: 400 });
    return NextResponse.json({ message: 'Categoria criada.', data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Não foi possível criar a categoria.' },
      { status: 500 },
    );
  }
}
