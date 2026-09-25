import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicStore, getStoreCatalog } from '@precoperto/backend';
import {
  formatCurrency,
  formatDayOfWeek,
  formatTime,
  getProductTypeLabel,
} from '@precoperto/utils';
import { getAssetUrl } from '@/lib/assets';

interface StorePayload {
  cuid: string;
  name: string;
  description: string | null;
  avatar: string | null;
  cover: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  social_links: Record<string, string | undefined>;
  is_private: boolean;
  hours: Array<{
    day_of_week: number;
    is_closed: boolean;
    open_time: string | null;
    close_time: string | null;
  }>;
}

interface CatalogPayload {
  products: Array<{
    cuid: string;
    name: string;
    type: 'product' | 'service';
    price: number;
    currency: 'AOA';
    description: string | null;
    cover: string | null;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cuid: string }>;
}): Promise<Metadata> {
  const { cuid } = await params;
  return { title: `Estabelecimento ${cuid}` };
}

export default async function StorePage({ params }: { params: Promise<{ cuid: string }> }) {
  const { cuid } = await params;
  const { createSupabaseServerClient } = await import('@/lib/supabase/server');
  const supabase = await createSupabaseServerClient();
  const [{ data: storeData, error: storeError }, { data: catalogData }] = await Promise.all([
    getPublicStore(supabase, cuid),
    getStoreCatalog(supabase, cuid),
  ]);
  if (storeError || !storeData) notFound();
  const store = storeData as unknown as StorePayload;
  const catalog = (catalogData ?? { products: [] }) as unknown as CatalogPayload;
  const coverUrl = getAssetUrl(store.cover, 'store-assets');
  const avatarUrl = getAssetUrl(store.avatar, 'store-assets');
  const socialLinks = Object.entries(store.social_links ?? {}).filter(([, value]) =>
    Boolean(value),
  );

  return (
    <div className="page-shell">
      <section className="store-hero">
        <div className="store-cover">
          {coverUrl ? (
            <img src={coverUrl} alt="" />
          ) : (
            <span aria-hidden="true">{store.name.slice(0, 1)}</span>
          )}
        </div>
        <div className="store-summary">
          <div className="avatar" style={{ width: 64, height: 64, marginBottom: 14 }}>
            {avatarUrl ? <img src={avatarUrl} alt="" /> : store.name.slice(0, 1)}
          </div>
          <h1>{store.name}</h1>
          {store.is_private ? (
            <span className="badge badge-warning">Estabelecimento privado</span>
          ) : null}
          {store.description ? <p className="lead">{store.description}</p> : null}
          <div className="contact-list">
            {store.address ? <span className="contact-pill">{store.address}</span> : null}
            {store.city || store.province ? (
              <span className="contact-pill">
                {[store.city, store.province].filter(Boolean).join(', ')}
              </span>
            ) : null}
            {store.phone ? (
              <a className="contact-pill" href={`tel:${store.phone}`}>
                {store.phone}
              </a>
            ) : null}
            {store.whatsapp ? (
              <a
                className="contact-pill"
                href={`https://wa.me/${store.whatsapp.replace(/[^0-9]/g, '')}`}
              >
                WhatsApp
              </a>
            ) : null}
            {store.website ? (
              <a className="contact-pill" href={store.website} target="_blank" rel="noreferrer">
                Website
              </a>
            ) : null}
            {store.email ? (
              <a className="contact-pill" href={`mailto:${store.email}`}>
                Email
              </a>
            ) : null}
          </div>
          {socialLinks.length ? (
            <div className="contact-list">
              {socialLinks.map(([name, url]) => (
                <a className="contact-pill" key={name} href={url} target="_blank" rel="noreferrer">
                  {name}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </section>
      <div className="detail-layout">
        <section>
          <div className="section-heading">
            <div>
              <h2>Produtos e serviços</h2>
              <p>{catalog.products.length} publicação(ões) activa(s)</p>
            </div>
          </div>
          {catalog.products.length ? (
            <div className="product-grid">
              {catalog.products.map((product) => (
                <Link
                  className="product-card"
                  href={`/products/${product.cuid}`}
                  key={product.cuid}
                >
                  <div className="product-cover">
                    <span>{product.name.slice(0, 1)}</span>
                  </div>
                  <div className="product-card-body">
                    <div className="product-meta">
                      <span className="product-type">{getProductTypeLabel(product.type)}</span>
                    </div>
                    <h3>{product.name}</h3>
                    <div className="product-price">
                      {formatCurrency(Number(product.price), product.currency)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>Ainda sem produtos</h3>
              <p>Este estabelecimento ainda não publicou produtos activos.</p>
            </div>
          )}
        </section>
        <aside className="panel">
          <div className="panel-header">
            <div>
              <h2>Horário</h2>
              <p>Informação do estabelecimento</p>
            </div>
          </div>
          <div className="hours-list">
            {store.hours?.map((hour) => (
              <div className="hours-row" key={hour.day_of_week}>
                <span>{formatDayOfWeek(hour.day_of_week)}</span>
                <span>
                  {hour.is_closed
                    ? 'Fechado'
                    : `${formatTime(hour.open_time)} – ${formatTime(hour.close_time)}`}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
