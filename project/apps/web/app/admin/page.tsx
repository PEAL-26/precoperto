import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getDashboard, listCategories } from '@precoperto/backend';
import { requireUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CategoryManager } from '@/components/CategoryManager';

export const metadata: Metadata = { title: 'Administração' };

export default async function AdminPage() {
  await requireUser('/admin');
  const supabase = await createSupabaseServerClient();
  const dashboard = await getDashboard(supabase);
  if (!dashboard.data || dashboard.data.user.role !== 'admin') redirect('/');
  const { data: categories, error } = await listCategories(supabase);
  if (error)
    return (
      <div className="page-shell">
        <div className="form-error">Não foi possível carregar as categorias.</div>
      </div>
    );
  return (
    <div className="page-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Administração</p>
          <h1>Categorias</h1>
          <p>Faça a gestão das categorias globais da plataforma.</p>
        </div>
      </div>
      <CategoryManager initialCategories={categories ?? []} />
    </div>
  );
}
