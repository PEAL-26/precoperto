import Link from 'next/link';
import type { SearchProduct } from '@precoperto/types';
import { formatCurrency, formatDistance, getInitials } from '@precoperto/utils';
import { getAssetUrl } from '@/lib/assets';

export function ProductCard({
  product,
  coordinates,
}: {
  product: SearchProduct;
  coordinates?: { latitude: number | null; longitude: number | null };
}) {
  const coverUrl = getAssetUrl(product.cover, 'product-assets');
  const distance = formatDistance(product.distance_meters);
  const search =
    coordinates?.latitude != null && coordinates?.longitude != null
      ? `?lat=${coordinates.latitude}&lng=${coordinates.longitude}`
      : '';

  return (
    <Link className="product-card" href={`/products/${product.product_cuid}${search}`}>
      <div className="product-cover">
        {coverUrl ? (
          <img src={coverUrl} alt="" />
        ) : (
          <span aria-hidden="true">{getInitials(product.name)}</span>
        )}
      </div>
      <div className="product-card-body">
        <div className="product-meta">
          <span className="product-type">{product.type === 'service' ? 'Serviço' : 'Produto'}</span>
          <span>{product.category_name}</span>
        </div>
        <h3>{product.name}</h3>
        {product.description ? <p className="muted">{product.description}</p> : null}
        <div className="product-price">
          {formatCurrency(Number(product.price), product.currency)}
        </div>
        <div className="store-line">
          <strong>{product.store_name}</strong>
          {distance ? (
            <span className="distance">{distance}</span>
          ) : (
            <span className="muted">Sem distância</span>
          )}
        </div>
      </div>
    </Link>
  );
}
