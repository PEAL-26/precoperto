import type { Metadata } from 'next';
import { LoginForm } from '@/components/LoginForm';

export const metadata: Metadata = { title: 'Entrar' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="auth-layout">
      <section className="auth-aside">
        <p className="eyebrow">Bem-vindo de volta</p>
        <h1>Encontre o preço certo.</h1>
        <p>Compare produtos e serviços Active perto de si, com informação simples e próxima.</p>
      </section>
      <section className="auth-card">
        <h2>Entrar na sua conta</h2>
        <p>Use o email e password do seu perfil.</p>
        <LoginForm returnTo={params.returnTo} />
      </section>
    </div>
  );
}
