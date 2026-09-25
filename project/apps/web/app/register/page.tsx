import type { Metadata } from 'next';
import { RegisterForm } from '@/components/RegisterForm';

export const metadata: Metadata = { title: 'Criar conta' };

export default function RegisterPage() {
  return (
    <div className="auth-layout">
      <section className="auth-aside">
        <p className="eyebrow">Comece agora</p>
        <h1>Mostre o que tem para oferecer.</h1>
        <p>
          Crie o seu perfil, publique produtos e serviços e deixe que os clientes encontrem os seus
          preços.
        </p>
      </section>
      <section className="auth-card">
        <h2>Criar conta</h2>
        <p>O primeiro registo cria o seu estabelecimento como pré-cadastro.</p>
        <RegisterForm />
      </section>
    </div>
  );
}
