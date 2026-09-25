'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { registerSchema } from '@precoperto/schemas';

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationState, setLocationState] = useState<'idle' | 'requesting' | 'granted' | 'denied'>(
    'idle',
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function requestLocation() {
    if (!navigator.geolocation) {
      setError('Este dispositivo não disponibiliza localização.');
      return;
    }
    setLocationState('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationState('granted');
      },
      () => {
        setLocationState('denied');
        setError('Precisamos da localização para criar o pré-cadastro do estabelecimento.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (latitude === null || longitude === null) {
      setError('Obtenha a localização antes de concluir o registo.');
      return;
    }
    const parsed = registerSchema.safeParse({ name, email, password, latitude, longitude });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Verifique os dados.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const payload = (await response.json()) as {
        message?: string;
        requiresConfirmation?: boolean;
      };
      if (!response.ok) throw new Error(payload.message ?? 'Não foi possível criar a conta.');
      if (payload.requiresConfirmation) {
        setSuccess(
          'Verifique o email recebido para activar a conta. Depois, entre para concluir o perfil.',
        );
      } else {
        router.replace('/my/profile');
        router.refresh();
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Não foi possível criar a conta.',
      );
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
      {success ? (
        <p className="form-success" role="status">
          {success}
        </p>
      ) : null}
      <div className="field">
        <label htmlFor="register-name">Nome</label>
        <input
          id="register-name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <span className="field-hint">Use pelo menos 8 caracteres.</span>
      </div>
      <div className="field">
        <label>Localização do estabelecimento</label>
        <button
          className="button button-secondary"
          type="button"
          onClick={requestLocation}
          disabled={locationState === 'requesting'}
        >
          {locationState === 'requesting'
            ? 'A obter localização…'
            : locationState === 'granted'
              ? 'Localização obtida'
              : 'Obter localização'}
        </button>
        {latitude !== null && longitude !== null ? (
          <span className="field-hint">Localização guardada apenas para criar o pré-cadastro.</span>
        ) : (
          <span className="field-hint">
            A localização é obrigatória para o pré-cadastro e não é usada para marketing.
          </span>
        )}
      </div>
      <button className="button button-primary button-block" type="submit" disabled={pending}>
        {pending ? 'A criar conta…' : 'Criar conta'}
      </button>
      <p className="muted">
        Já tem conta? <Link href="/login">Entrar</Link>
      </p>
    </form>
  );
}
