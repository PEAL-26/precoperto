import { NextResponse } from 'next/server';
import { storeUpdateSchema } from '@precoperto/schemas';
import { getDashboard, toPortugueseError, updateStore } from '@precoperto/backend';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = storeUpdateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 },
    );
  try {
    const supabase = await createSupabaseServerClient();
    const dashboard = await getDashboard(supabase);
    if (dashboard.error || !dashboard.data)
      return NextResponse.json(
        { message: dashboard.error?.message ?? 'SessãoRequired.' },
        { status: 401 },
      );
    const storeCuid = body.storeCuid;
    if (storeCuid !== dashboard.data.store.cuid)
      return NextResponse.json(
        { message: 'Não tem permissão para editar este estabelecimento.' },
        { status: 403 },
      );
    const { error } = await updateStore(supabase, dashboard.data.store.cuid, parsed.data);
    if (error) return NextResponse.json({ message: toPortugueseError(error) }, { status: 400 });
    return NextResponse.json({ message: 'Estabelecimento actualizado.' });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Não foi possível actualizar.' },
      { status: 500 },
    );
  }
}
