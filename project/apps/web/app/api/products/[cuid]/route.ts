import { NextResponse } from 'next/server';
import { productUpdateSchema } from '@precoperto/schemas';
import { getDashboard, toPortugueseError, updateProduct } from '@precoperto/backend';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ cuid: string }> }) {
  const { cuid } = await params;
  const body = await request.json().catch(() => null);
  const parsed = productUpdateSchema.safeParse(body);
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
    const product = dashboard.data.products.find((item) => item.cuid === cuid);
    if (!product) return NextResponse.json({ message: 'Produto não encontrado.' }, { status: 404 });
    const { data, error } = await updateProduct(supabase, cuid, parsed.data);
    if (error) return NextResponse.json({ message: toPortugueseError(error) }, { status: 400 });
    return NextResponse.json({ message: 'Produto actualizado.', data });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Não foi possível actualizar o produto.',
      },
      { status: 500 },
    );
  }
}
