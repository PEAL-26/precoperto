import type { Metadata } from 'next';
import { getDashboard } from '@precoperto/backend';
import { requireUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ProfileDashboard } from '@/components/ProfileDashboard';
import { BootstrapPrompt } from '@/components/BootstrapPrompt';

export const metadata: Metadata = { title: 'Meu perfil' };

export default async function ProfilePage() {
  const authUser = await requireUser('/my/profile');
  const supabase = await createSupabaseServerClient();
  const { data, error } = await getDashboard(supabase);
  if (error || !data)
    return <BootstrapPrompt email={authUser.email ?? ''} metadata={authUser.user_metadata ?? {}} />;
  return <ProfileDashboard initialData={data} />;
}
