'use client';

import { useState } from 'react';
import type { Store, SocialLinks } from '@precoperto/types';
import { getStoreAssetPath } from '@precoperto/utils';
import { uploadAsset } from '@precoperto/supabase';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { apiRequest } from '@/lib/api';

type Section = 'info' | 'location' | 'contacts' | 'socials' | 'privacy';

const SOCIAL_FIELDS: [keyof SocialLinks, string][] = [
  ['facebook', 'Facebook'],
  ['instagram', 'Instagram'],
  ['tiktok', 'TikTok'],
  ['youtube', 'YouTube'],
];

export function StoreSectionForm({
  store,
  section,
  onSaved,
  onCancel,
}: {
  store: Store;
  section: Section;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: store.name,
    description: store.description ?? '',
    address: store.address ?? '',
    city: store.city ?? '',
    province: store.province ?? '',
    latitude: String(store.latitude),
    longitude: String(store.longitude),
    phone: store.phone ?? '',
    whatsapp: store.whatsapp ?? '',
    email: store.email ?? '',
    website: store.website ?? '',
    is_private: store.is_private,
    social_links: store.social_links ?? {},
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const update = (key: string, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  const updateSocial = (key: keyof SocialLinks, value: string) =>
    setForm((current) => ({
      ...current,
      social_links: { ...current.social_links, [key]: value || undefined },
    }));

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { storeCuid: store.cuid };
      if (section === 'info')
        Object.assign(body, {
          name: form.name,
          description: form.description || null,
        });
      if (section === 'socials') Object.assign(body, { social_links: form.social_links });
      if (section === 'location')
        Object.assign(body, {
          address: form.address || null,
          city: form.city || null,
          province: form.province || null,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
        });
      if (section === 'contacts')
        Object.assign(body, {
          phone: form.phone || null,
          whatsapp: form.whatsapp || null,
          email: form.email || null,
          website: form.website || null,
        });
      if (section === 'privacy') Object.assign(body, { is_private: form.is_private });
      const client = createSupabaseBrowserClient();
      if (avatar) {
        const path = getStoreAssetPath(store.cuid, 'avatar', avatar.name);
        const upload = await uploadAsset(client, 'store-assets', path, avatar, avatar.type);
        if (upload.error) throw new Error(upload.error.message);
        body.avatar = path;
      }
      if (cover) {
        const path = getStoreAssetPath(store.cuid, 'cover', cover.name);
        const upload = await uploadAsset(client, 'store-assets', path, cover, cover.type);
        if (upload.error) throw new Error(upload.error.message);
        body.cover = path;
      }
      await apiRequest('/api/store', { method: 'PATCH', body: JSON.stringify(body) });
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível guardar.');
    } finally {
      setPending(false);
    }
  }

  const title = {
    info: 'Editar perfil',
    location: 'Editar localização',
    contacts: 'Editar contactos',
    socials: 'Editar redes sociais',
    privacy: 'Privacidade',
  }[section];
  return (
    <form className="form-stack" onSubmit={save} aria-label={title}>
      {error ? <p className="form-error">{error}</p> : null}
      {section === 'info' ? (
        <>
          <div className="field">
            <label htmlFor="store-name">Nome do estabelecimento</label>
            <input
              id="store-name"
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="store-description">Descrição</label>
            <textarea
              id="store-description"
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="store-avatar">Avatar</label>
              <input
                id="store-avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setAvatar(event.target.files?.[0] ?? null)}
              />
            </div>
            <div className="field">
              <label htmlFor="store-cover">Capa</label>
              <input
                id="store-cover"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setCover(event.target.files?.[0] ?? null)}
              />
            </div>
          </div>
        </>
      ) : null}
      {section === 'location' ? (
        <>
          <div className="field">
            <label htmlFor="store-address">Endereço</label>
            <input
              id="store-address"
              value={form.address}
              onChange={(event) => update('address', event.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="store-city">Cidade</label>
              <input
                id="store-city"
                value={form.city}
                onChange={(event) => update('city', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="store-province">Província</label>
              <input
                id="store-province"
                value={form.province}
                onChange={(event) => update('province', event.target.value)}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="store-latitude">Latitude</label>
              <input
                id="store-latitude"
                type="number"
                step="any"
                value={form.latitude}
                onChange={(event) => update('latitude', event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="store-longitude">Longitude</label>
              <input
                id="store-longitude"
                type="number"
                step="any"
                value={form.longitude}
                onChange={(event) => update('longitude', event.target.value)}
                required
              />
            </div>
          </div>
        </>
      ) : null}
      {section === 'contacts' ? (
        <>
          <div className="form-row">
            <div className="field">
              <label htmlFor="store-phone">Telefone</label>
              <input
                id="store-phone"
                value={form.phone}
                onChange={(event) => update('phone', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="store-whatsapp">WhatsApp</label>
              <input
                id="store-whatsapp"
                value={form.whatsapp}
                onChange={(event) => update('whatsapp', event.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="store-email">Email</label>
            <input
              id="store-email"
              type="email"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="store-website">Website</label>
            <input
              id="store-website"
              type="url"
              value={form.website}
              onChange={(event) => update('website', event.target.value)}
            />
          </div>
        </>
      ) : null}
      {section === 'socials' ? (
        <>
          <p className="field-hint">
            Cole apenas o endereço completo do perfil. Deixe em branco para remover a ligação.
          </p>
          {SOCIAL_FIELDS.map(([key, label]) => (
            <div className="field" key={key}>
              <label htmlFor={`store-${key}`}>{label}</label>
              <input
                id={`store-${key}`}
                type="url"
                value={form.social_links[key] ?? ''}
                onChange={(event) => updateSocial(key, event.target.value)}
              />
            </div>
          ))}
        </>
      ) : null}
      {section === 'privacy' ? (
        <div className="field">
          <label htmlFor="store-private">
            <input
              id="store-private"
              type="checkbox"
              checked={form.is_private}
              onChange={(event) => update('is_private', event.target.checked)}
            />{' '}
            Manter o estabelecimento privado
          </label>
          <span className="field-hint">
            Os produtos activos continuam pesquisáveis, mas o perfil e os contactos ficam
            protegidos.
          </span>
        </div>
      ) : null}
      <div className="form-actions">
        <button className="button button-secondary" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? 'A guardar…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
