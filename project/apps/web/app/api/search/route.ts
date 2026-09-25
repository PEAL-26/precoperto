import { NextResponse } from 'next/server';
import { searchSchema } from '@precoperto/schemas';
import { getNextSearchCursor, searchProducts } from '@precoperto/backend';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = searchSchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success)
    return NextResponse.json({ message: 'Parâmetros de pesquisa inválidos.' }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await searchProducts(supabase, {
      search: parsed.data.q,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      cursor: parsed.data.cursor,
      limit: parsed.data.limit,
    });
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    const items = data ?? [];
    return NextResponse.json({ items, nextCursor: getNextSearchCursor(items) });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Não foi possível pesquisar.' },
      { status: 500 },
    );
  }
}
