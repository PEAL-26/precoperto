import { NextResponse } from 'next/server';
import { categorySchema } from '@precoperto/schemas';
import {
  deleteCategory,
  getDashboard,
  toPortugueseError,
  updateCategory,
} from '@precoperto/backend';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function requireAdmin(request: Request) {
  const supabase = await createSupabaseServerClient();
  const dashboard = await getDashboard(supabase);
  return { supabase, dashboard };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ cuid: string }> }) {
  const { cuid } = await params;
  const parsed = categorySchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Categoria inválida.' },
      { status: 400 },
    );
  try {
    const { supabase, dashboard } = await requireAdmin(request);
    if (dashboard.error || !dashboard.data)
      return NextResponse.json({ message: 'SessãoRequired.' }, { status: 401 });
    if (dashboard.data.user.role !== 'admin')
      return NextResponse.json({ message: 'Apenas administradores.' }, { status: 403 });
    const { data, error } = await updateCategory(supabase, cuid, parsed.data);
    if (error) return NextResponse.json({ message: toPortugueseError(error) }, { status: 400 });
    return NextResponse.json({ message: 'Categoria actualizada.', data });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Não foi possível actualizar.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ cuid: string }> }) {
  const { cuid } = await params;
  try {
    const { supabase, dashboard } = await requireAdmin(request);
    if (dashboard.error || !dashboard.data)
      return NextResponse.json({ message: 'SessãoRequired.' }, { status: 401 });
    if (dashboard.data.user.role !== 'admin')
      return NextResponse.json({ message: 'Apenas administradores.' }, { status: 403 });
    const { error } = await deleteCategory(supabase, cuid);
    if (error) return NextResponse.json({ message: toPortugueseError(error) }, { status: 400 });
    return NextResponse.json({ message: 'Categoria eliminada.' });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Não foi possível eliminar.' },
      { status: 500 },
    );
  }
}
