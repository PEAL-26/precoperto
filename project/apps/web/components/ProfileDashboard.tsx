'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { DashboardData } from '@precoperto/supabase';
import { getProductStatusLabel } from '@precoperto/utils';
import { formatCurrency, formatDayOfWeek, formatTime, getInitials } from '@precoperto/utils';
import { getAssetUrl } from '@/lib/assets';
import { apiRequest } from '@/lib/api';
import { Modal } from '@/components/Modal';
import { ProductEditor } from '@/components/ProductEditor';
import { StoreSectionForm } from '@/components/StoreSectionForm';

const SOCIAL_LABELS: [keyof DashboardData['store']['social_links'], string][] = [
  ['facebook', 'Facebook'],
  ['instagram', 'Instagram'],
  ['tiktok', 'TikTok'],
  ['youtube', 'YouTube'],
];

export function ProfileDashboard({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData);
  const [section, setSection] = useState<
    'info' | 'location' | 'contacts' | 'socials' | 'privacy' | null
  >(null);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<
    DashboardData['products'][number] | undefined
  >();
  const [error, setError] = useState<string | null>(null);
  const avatarUrl = getAssetUrl(data.store.avatar, 'store-assets');
  const coverUrl = getAssetUrl(data.store.cover, 'store-assets');

  function refresh() {
    window.location.reload();
  }

  async function updateStatus(cuid: string, status: 'active' | 'inactive' | 'archived') {
    setError(null);
    try {
      await apiRequest(`/api/products/${cuid}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setData((current) => ({
        ...current,
        products: current.products.map((product) =>
          product.cuid === cuid ? { ...product, status } : product,
        ),
      }));
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : 'Não foi possível actualizar o estado.',
      );
    }
  }

  return (
    <div className="page-shell">
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <section className="profile-hero">
        <div className="avatar">
          {avatarUrl ? <img src={avatarUrl} alt="" /> : getInitials(data.store.name)}
        </div>
        <div>
          <span className="badge">{data.store.is_private ? 'Privado' : 'Público'}</span>
          <h1>{data.store.name}</h1>
          <p>
            {data.user.name} · {data.user.email}
          </p>
        </div>
        <div className="inline-actions">
          <Link
            className="button button-secondary"
            href={`/store/${data.store.cuid}`}
            target="_blank"
          >
            Ver página
          </Link>
          <button
            className="button button-primary"
            type="button"
            onClick={() => setSection('info')}
          >
            Editar perfil
          </button>
        </div>
      </section>
      {coverUrl ? (
        <div className="store-cover" style={{ marginBottom: 22, minHeight: 160 }}>
          <img src={coverUrl} alt="" />
        </div>
      ) : null}
      <div className="profile-grid">
        <div>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Informação</h2>
                <p>Dados do estabelecimento e perfil</p>
              </div>
              <button
                className="button button-secondary button-small"
                type="button"
                onClick={() => setSection('info')}
              >
                Editar
              </button>
            </div>
            <div className="info-list">
              <div className="info-row">
                <span>Utilizador</span>
                <span>{data.user.name}</span>
              </div>
              <div className="info-row">
                <span>Email</span>
                <span>{data.user.email}</span>
              </div>
              <div className="info-row">
                <span>Privacidade</span>
                <span>{data.store.is_private ? 'Privado' : 'Público'}</span>
              </div>
              <div className="info-row">
                <span>Redes</span>
                <span>
                  {Object.keys(data.store.social_links ?? {}).length
                    ? 'Configuradas'
                    : 'Por configurar'}
                </span>
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Localização</h2>
                <p>Endereço e coordenadas</p>
              </div>
              <button
                className="button button-secondary button-small"
                type="button"
                onClick={() => setSection('location')}
              >
                Editar
              </button>
            </div>
            <div className="info-list">
              <div className="info-row">
                <span>Endereço</span>
                <span>{data.store.address || 'Por completar'}</span>
              </div>
              <div className="info-row">
                <span>Cidade</span>
                <span>{data.store.city || '—'}</span>
              </div>
              <div className="info-row">
                <span>Província</span>
                <span>{data.store.province || '—'}</span>
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Contactos</h2>
                <p>Canais de contacto públicos</p>
              </div>
              <button
                className="button button-secondary button-small"
                type="button"
                onClick={() => setSection('contacts')}
              >
                Editar
              </button>
            </div>
            <div className="info-list">
              <div className="info-row">
                <span>Telefone</span>
                <span>{data.store.phone || '—'}</span>
              </div>
              <div className="info-row">
                <span>WhatsApp</span>
                <span>{data.store.whatsapp || '—'}</span>
              </div>
              <div className="info-row">
                <span>Website</span>
                <span>{data.store.website || '—'}</span>
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Redes sociais</h2>
                <p>Perfis públicos da sua loja</p>
              </div>
              <button
                className="button button-secondary button-small"
                type="button"
                onClick={() => setSection('socials')}
              >
                Editar
              </button>
            </div>
            <div className="contact-list">
              {SOCIAL_LABELS.map(([key, label]) => {
                const value = data.store.social_links?.[key];
                return value ? (
                  <a
                    className="contact-pill"
                    key={key}
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {label}
                  </a>
                ) : null;
              })}
              {Object.values(data.store.social_links ?? {}).every((value) => !value) ? (
                <span className="muted">Por configurar</span>
              ) : null}
            </div>
          </section>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Horários</h2>
                <p>Um período por dia</p>
              </div>
              <button
                className="button button-secondary button-small"
                type="button"
                onClick={() => setHoursOpen(true)}
              >
                Editar
              </button>
            </div>
            <div className="hours-list">
              {data.hours.map((hour) => (
                <div className="hours-row" key={hour.cuid}>
                  <span>{formatDayOfWeek(hour.day_of_week, true)}</span>
                  <span>
                    {hour.is_closed
                      ? 'Fechado'
                      : `${formatTime(hour.open_time)} – ${formatTime(hour.close_time)}`}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Produtos e serviços</h2>
              <p>{data.products.length} publicação(ões)</p>
            </div>
            <button
              className="button button-primary button-small"
              type="button"
              onClick={() => {
                setEditingProduct(undefined);
                setProductOpen(true);
              }}
            >
              Adicionar produto
            </button>
          </div>
          {data.products.length ? (
            <div className="profile-products">
              {data.products.map((product) => (
                <article className="profile-product" key={product.cuid}>
                  <div>
                    <span className={`badge ${product.status === 'active' ? '' : 'badge-muted'}`}>
                      {getProductStatusLabel(product.status)}
                    </span>
                    <h3>{product.name}</h3>
                    <p>
                      {product.type === 'service' ? 'Serviço' : 'Produto'} ·{' '}
                      {formatCurrency(Number(product.price), product.currency)}
                    </p>
                  </div>
                  <div className="product-actions">
                    <button
                      className="button button-secondary button-small"
                      type="button"
                      onClick={() => {
                        setEditingProduct(product);
                        setProductOpen(true);
                      }}
                    >
                      Editar
                    </button>
                    {product.status !== 'active' ? (
                      <button
                        className="button button-secondary button-small"
                        type="button"
                        onClick={() => void updateStatus(product.cuid, 'active')}
                      >
                        Activar
                      </button>
                    ) : (
                      <button
                        className="button button-secondary button-small"
                        type="button"
                        onClick={() => void updateStatus(product.cuid, 'inactive')}
                      >
                        Desactivar
                      </button>
                    )}
                    {product.status !== 'archived' ? (
                      <button
                        className="button button-danger button-small"
                        type="button"
                        onClick={() => void updateStatus(product.cuid, 'archived')}
                      >
                        Arquivar
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">+</span>
              <h3>Ainda não publica nada</h3>
              <p>Adicione o primeiro produto ou serviço para começar.</p>
            </div>
          )}
        </section>
      </div>
      {section ? (
        <Modal
          title={
            {
              info: 'Editar perfil',
              location: 'Editar localização',
              contacts: 'Editar contactos',
              socials: 'Editar redes sociais',
              privacy: 'Privacidade',
            }[section]
          }
          onClose={() => setSection(null)}
        >
          <StoreSectionForm
            store={data.store}
            section={section}
            onSaved={refresh}
            onCancel={() => setSection(null)}
          />
        </Modal>
      ) : null}
      {hoursOpen ? (
        <HoursEditor
          storeCuid={data.store.cuid}
          hours={data.hours}
          onSaved={refresh}
          onCancel={() => setHoursOpen(false)}
        />
      ) : null}
      {productOpen ? (
        <Modal
          title={editingProduct ? 'Editar produto' : 'Adicionar produto'}
          onClose={() => setProductOpen(false)}
        >
          <ProductEditor
            storeCuid={data.store.cuid}
            categories={data.categories}
            product={editingProduct}
            onSaved={refresh}
            onCancel={() => setProductOpen(false)}
          />
        </Modal>
      ) : null}
    </div>
  );
}

function HoursEditor({
  storeCuid,
  hours,
  onSaved,
  onCancel,
}: {
  storeCuid: string;
  hours: DashboardData['hours'];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState(
    hours.map((hour) => ({
      day_of_week: hour.day_of_week,
      is_closed: hour.is_closed,
      open_time: hour.open_time ?? '08:00',
      close_time: hour.close_time ?? '18:00',
    })),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  function update(index: number, key: string, value: string | boolean) {
    setValues((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    );
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await apiRequest('/api/hours', {
        method: 'PUT',
        body: JSON.stringify({
          storeCuid,
          hours: values.map((value) => ({
            ...value,
            open_time: value.is_closed ? null : value.open_time,
            close_time: value.is_closed ? null : value.close_time,
          })),
        }),
      });
      onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Não foi possível guardar os horários.',
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal title="Editar horários" onClose={onCancel}>
      <form className="form-stack" onSubmit={save}>
        {error ? <p className="form-error">{error}</p> : null}
        {values.map((value, index) => (
          <div className="panel" key={value.day_of_week} style={{ padding: 14, marginTop: 0 }}>
            <div className="hours-row" style={{ paddingTop: 0 }}>
              <strong>{formatDayOfWeek(value.day_of_week)}</strong>
              <label>
                <input
                  type="checkbox"
                  checked={value.is_closed}
                  onChange={(event) => update(index, 'is_closed', event.target.checked)}
                />{' '}
                Fechado
              </label>
            </div>
            {!value.is_closed ? (
              <div className="form-row" style={{ marginTop: 10 }}>
                <div className="field">
                  <label htmlFor={`open-${value.day_of_week}`}>Abertura</label>
                  <input
                    id={`open-${value.day_of_week}`}
                    type="time"
                    value={value.open_time}
                    onChange={(event) => update(index, 'open_time', event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`close-${value.day_of_week}`}>Fecho</label>
                  <input
                    id={`close-${value.day_of_week}`}
                    type="time"
                    value={value.close_time}
                    onChange={(event) => update(index, 'close_time', event.target.value)}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ))}
        <div className="form-actions">
          <button className="button button-secondary" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="button button-primary" type="submit" disabled={pending}>
            {pending ? 'A guardar…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
