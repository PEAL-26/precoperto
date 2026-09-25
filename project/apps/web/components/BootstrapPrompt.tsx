'use client';

import { useState } from 'react';
import { bootstrapProfileSchema } from '@precoperto/schemas';
import { apiRequest } from '@/lib/api';

export function BootstrapPrompt({
  email,
  metadata,
}: {
  email: string;
  metadata: Record<string, unknown>;
}) {
  const [name, setName] = useState(typeof metadata.name === 'string' ? metadata.name : '');
  const [latitude, setLatitude] = useState<number | null>(
    typeof metadata.latitude === 'number' ? metadata.latitude : null,
  );
  const [longitude, setLongitude] = useState<number | null>(
    typeof metadata.longitude === 'number' ? metadata.longitude : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function locate() {
    if (!navigator.geolocation) return setError('Este dispositivo não disponibiliza localização.');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setError(null);
      },
      () => setError('Não foi possível obter a localização.'),
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (latitude === null || longitude === null)
      return setError('Obtenha a localização para concluir o perfil.');
    const parsed = bootstrapProfileSchema.safeParse({
      name,
      email,
      latitude,
      longitude,
    });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Verifique os dados.');
    setPending(true);
    try {
      await apiRequest('/api/auth/bootstrap', {
        method: 'POST',
        body: JSON.stringify({ name, email, latitude, longitude }),
      });
      window.location.reload();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Não foi possível concluir o perfil.',
      );
      setPending(false);
    }
  }

  return (
    <div className="page-shell narrow-page">
      <div className="empty-state">
        <span className="empty-icon">+</span>
        <h1>Complete o seu perfil</h1>
        <p>A sua conta está verificada, mas ainda não tem um estabelecimento pré-registado.</p>
        <form
          className="form-stack"
          style={{ width: '100%', marginTop: 20, textAlign: 'left' }}
          onSubmit={submit}
        >
          {error ? <p className="form-error">{error}</p> : null}
          <div className="field">
            <label htmlFor="bootstrap-name">Nome</label>
            <input
              id="bootstrap-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Localização</label>
            <button className="button button-secondary" type="button" onClick={locate}>
              {latitude !== null && longitude !== null ? 'Localização obtida' : 'Obter localização'}
            </button>
          </div>
          <button className="button button-primary" type="submit" disabled={pending}>
            {pending ? 'A concluir…' : 'Concluir perfil'}
          </button>
        </form>
      </div>
    </div>
  );
}
