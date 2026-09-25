import 'dotenv/config';

import { createServiceSupabaseClient } from '../service-client';
import { toPortugueseError } from '../errors';

async function main() {
  const email = process.argv[2] ?? process.env.PRECOPERTO_ADMIN_EMAIL;
  if (!email) {
    throw new Error('Uso: pnpm admin:promote <email> ou defina PRECOPERTO_ADMIN_EMAIL.');
  }

  const client = createServiceSupabaseClient();
  const normalizedEmail = email.trim().toLowerCase();
  const { data: user, error: lookupError } = await client
    .from('users')
    .select('cuid,email,role')
    .eq('email', normalizedEmail)
    .single();

  if (lookupError || !user) {
    throw new Error(toPortugueseError(lookupError ?? { message: 'Utilizador não encontrado.' }));
  }

  const { error } = await client.from('users').update({ role: 'admin' }).eq('cuid', user.cuid);
  if (error) throw new Error(toPortugueseError(error));

  console.log(`Utilizador ${user.email} promovido a administrador.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Não foi possível promover o utilizador.');
  process.exitCode = 1;
});
