import { NextResponse } from 'next/server';
import { productCreateSchema } from '@precoperto/schemas';
import { createProduct, getDashboard, toPortugueseError } from '@precoperto/backend';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = productCreateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Produto inválido.' },
      { status: 400 },
    );
  try {
    const supabase = await createSupabaseServerClient();
    const dashboard = await getDashboard(supabase);
    if (dashboard.error || !dashboard.data)
      return NextResponse.json({ message: 'SessãoRequired.' }, { status: 401 });
    if (body.storeCuid !== dashboard.data.store.cuid)
      return NextResponse.json(
        { message: 'Não tem permissão para publicar neste estabelecimento.' },
        { status: 403 },
      );
    const { data, error } = await createProduct(supabase, {
      ...parsed.data,
      store_cuid: dashboard.data.store.cuid,
    });
    if (error) return NextResponse.json({ message: toPortugueseError(error) }, { status: 400 });
    return NextResponse.json({ message: 'Produto criado.', data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Não foi possível criar o produto.' },
      { status: 500 },
    );
  }
}
