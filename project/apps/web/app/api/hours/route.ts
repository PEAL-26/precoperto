import { NextResponse } from 'next/server';
import { storeHoursListSchema } from '@precoperto/schemas';
import { getDashboard, toPortugueseError, upsertStoreHours } from '@precoperto/backend';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = storeHoursListSchema.safeParse(body?.hours);
  if (!parsed.success)
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Horários inválidos.' },
      { status: 400 },
    );
  try {
    const supabase = await createSupabaseServerClient();
    const dashboard = await getDashboard(supabase);
    if (dashboard.error || !dashboard.data)
      return NextResponse.json({ message: 'SessãoRequired.' }, { status: 401 });
    if (body.storeCuid !== dashboard.data.store.cuid)
      return NextResponse.json(
        { message: 'Não tem permissão para editar estes horários.' },
        { status: 403 },
      );
    const { error } = await upsertStoreHours(supabase, dashboard.data.store.cuid, parsed.data);
    if (error) return NextResponse.json({ message: toPortugueseError(error) }, { status: 400 });
    return NextResponse.json({ message: 'Horários actualizados.' });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Não foi possível actualizar.' },
      { status: 500 },
    );
  }
}
