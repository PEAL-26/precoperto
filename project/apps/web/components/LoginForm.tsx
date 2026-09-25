'use client';

import Link from 'next/link';
import { useState } from 'react';
import { loginSchema } from '@precoperto/schemas';

export function LoginForm({ returnTo = '/' }: { returnTo?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Verifique os dados.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? 'Não foi possível entrar.');
      const safeReturnTo = returnTo.startsWith('/') ? returnTo : '/';
      window.location.assign(safeReturnTo);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível entrar.');
      setPending(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="field">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      <button className="button button-primary button-block" type="submit" disabled={pending}>
        {pending ? 'A entrar…' : 'Entrar'}
      </button>
      <p className="muted">
        Ainda não tem conta? <Link href="/register">Criar conta</Link>
      </p>
    </form>
  );
}
