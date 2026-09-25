import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Json } from '@precoperto/types';
import { getProductDetails } from '@precoperto/backend';
import { formatCurrency, formatDayOfWeek, formatDistance, formatTime } from '@precoperto/utils';
import { getAssetUrl } from '@/lib/assets';

interface ProductPayload {
  product: {
    cuid: string;
    name: string;
    type: 'product' | 'service';
    price: number;
    currency: 'AOA';
    description: string | null;
    cover: string | null;
  };
  category: { name: string };
  store: {
    cuid: string;
    name: string;
    is_private: boolean;
    address: string | null;
    city: string | null;
    province: string | null;
    phone: string | null;
    whatsapp: string | null;
    website: string | null;
    social_links: Record<string, string | undefined>;
  };
  hours: Array<{
    day_of_week: number;
    is_closed: boolean;
    open_time: string | null;
    close_time: string | null;
  }> | null;
  distance_meters?: number | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cuid: string }>;
}): Promise<Metadata> {
  const { cuid } = await params;
  return { title: `Produto ${cuid}` };
}

export default async function ProductPage({ params }: { params: Promise<{ cuid: string }> }) {
  const { cuid } = await params;
  const supabase = await import('@/lib/supabase/server').then((module) =>
    module.createSupabaseServerClient(),
  );
  const { data, error } = await getProductDetails(supabase, cuid);
  if (error || !data) notFound();
  const payload = data as unknown as ProductPayload;
  const coverUrl = getAssetUrl(payload.product.cover, 'product-assets');
  const store = payload.store;
  const socialLinks = Object.entries(store.social_links ?? {}).filter(([, value]) =>
    Boolean(value),
  );

  return (
    <div className="page-shell">
      <div className="detail-layout">
        <div className="detail-cover">
          {coverUrl ? (
            <img src={coverUrl} alt={payload.product.name} />
          ) : (
            <span aria-hidden="true">{payload.product.name.slice(0, 1)}</span>
          )}
        </div>
        <div className="detail-card">
          <p className="eyebrow">
            {payload.product.type === 'service' ? 'Serviço' : 'Produto'} · {payload.category.name}
          </p>
          <h1>{payload.product.name}</h1>
          <div className="detail-price">
            {formatCurrency(Number(payload.product.price), payload.product.currency)}
          </div>
          {payload.product.description ? (
            <p className="lead">{payload.product.description}</p>
          ) : null}
          <dl className="detail-list">
            <div>
              <dt>Estabelecimento</dt>
              <dd>{store.name}</dd>
            </div>
            {store.city || store.province ? (
              <div>
                <dt>Localização</dt>
                <dd>{[store.city, store.province].filter(Boolean).join(', ')}</dd>
              </div>
            ) : null}
            {store.address ? (
              <div>
                <dt>Endereço</dt>
                <dd>{store.address}</dd>
              </div>
            ) : null}
            {store.phone ? (
              <div>
                <dt>Telefone</dt>
                <dd>
                  <a href={`tel:${store.phone}`}>{store.phone}</a>
                </dd>
              </div>
            ) : null}
            {store.whatsapp ? (
              <div>
                <dt>WhatsApp</dt>
                <dd>
                  <a href={`https://wa.me/${store.whatsapp.replace(/[^0-9]/g, '')}`}>
                    {store.whatsapp}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
          {store.is_private ? (
            <p className="form-success">
              Este estabelecimento é privado. Os contactos estão protegidos.
            </p>
          ) : (
            <Link className="button button-primary" href={`/store/${store.cuid}`}>
              Ver estabelecimento
            </Link>
          )}
        </div>
      </div>
      {payload.hours?.length ? (
        <section className="panel" style={{ marginTop: 24 }}>
          <div className="panel-header">
            <div>
              <h2>Horário</h2>
              <p>Horário do estabelecimento</p>
            </div>
          </div>
          <div className="hours-list">
            {payload.hours.map((hour) => (
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
        </section>
      ) : null}
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
  );
}
