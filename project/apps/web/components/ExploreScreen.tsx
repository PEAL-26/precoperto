'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SearchProduct } from '@precoperto/types';
import { ProductCard } from '@/components/ProductCard';

interface ExploreResponse {
  items: SearchProduct[];
  nextCursor: string | null;
}

type LocationState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

export function ExploreScreen({ initialQuery = '' }: { initialQuery?: string }) {
  const [input, setInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [items, setItems] = useState<SearchProduct[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const requestedLocation = useRef(false);

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationState('unavailable');
      return;
    }
    setLocationState('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationState('granted');
      },
      () => setLocationState('denied'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  useEffect(() => {
    if (!requestedLocation.current) {
      requestedLocation.current = true;
      void requestLocation();
    }
  }, [requestLocation]);

  const load = useCallback(
    async (nextCursor: string | null, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ q: query, limit: '24' });
        if (latitude !== null && longitude !== null) {
          params.set('latitude', String(latitude));
          params.set('longitude', String(longitude));
        }
        if (nextCursor) params.set('cursor', nextCursor);
        const response = await fetch(`/api/search?${params.toString()}`);
        const payload = (await response.json()) as ExploreResponse & { message?: string };
        if (!response.ok) throw new Error(payload.message ?? 'Não foi possível pesquisar.');
        setItems((current) => (append ? [...current, ...payload.items] : payload.items));
        setCursor(payload.nextCursor);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Não foi possível pesquisar.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [latitude, longitude, query],
  );

  useEffect(() => {
    // Initial data is fetched from the external search API when the query changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(null, false);
  }, [load]);

  useEffect(() => {
    const element = sentinel.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && cursor && !loadingMore && !loading)
          void load(cursor, true);
      },
      { rootMargin: '500px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [cursor, load, loading, loadingMore]);

  return (
    <div className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Descubra melhor</p>
          <h1>Preços perto de si, sem adivinhações.</h1>
          <p className="lead">
            Pesquise produtos e serviços e compare o preço oferecido por estabelecimentos próximos.
          </p>
        </div>
        <div className="hero-panel">
          <h2>Explore o que está perto</h2>
          <p>
            Cada resultado mostra o preço, o estabelecimento e a distância quando permite a
            localização.
          </p>
          <div className="hero-stat">
            <strong>Global</strong>
            <span>pesquisa sem limite de raio</span>
          </div>
        </div>
      </section>

      <form
        className="search-panel"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(input.trim());
        }}
      >
        <label className="sr-only" htmlFor="explore-search">
          Pesquisar
        </label>
        <input
          id="explore-search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="O que procura? Ex.: arroz"
        />
        <button className="button button-primary" type="submit">
          Pesquisar
        </button>
      </form>

      <div className="location-banner">
        <div>
          <strong>
            {locationState === 'granted' ? 'Localização activada' : 'Usar a sua localização?'}
          </strong>
          <p>
            {locationState === 'granted'
              ? 'Os resultados serão ordenados por relevância e proximidade.'
              : locationState === 'denied'
                ? 'A permissão foi recusada. Pode continuar sem distância.'
                : locationState === 'requesting'
                  ? 'A pedir autorização…'
                  : 'A localização é usada apenas para ordenar resultados e não é guardada.'}
          </p>
        </div>
        <div className="location-actions">
          {locationState !== 'granted' ? (
            <button
              className="button button-secondary button-small"
              type="button"
              onClick={() => void requestLocation()}
            >
              Usar localização
            </button>
          ) : null}
          {locationState === 'granted' ? (
            <button
              className="button button-ghost button-small"
              type="button"
              onClick={() => {
                setLatitude(null);
                setLongitude(null);
                setLocationState('idle');
              }}
            >
              Remover
            </button>
          ) : null}
        </div>
      </div>

      <div className="section-heading">
        <div>
          <h2>{query ? `Resultados para “${query}”` : 'Produtos e serviços'}</h2>
          <p>
            {items.length} resultado{items.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {error ? (
        <div className="form-error" role="alert">
          {error}
        </div>
      ) : null}
      {loading ? (
        <div className="product-grid">
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </div>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">
            ⌕
          </span>
          <h3>Nenhum resultado encontrado</h3>
          <p>Tente outra palavra ou pesquise sem localização.</p>
        </div>
      ) : null}
      {items.length > 0 ? (
        <div className="product-grid">
          {items.map((product) => (
            <ProductCard key={product.product_cuid} product={product} />
          ))}
        </div>
      ) : null}
      <div ref={sentinel} aria-hidden="true" />
      {loadingMore ? (
        <p className="muted" style={{ textAlign: 'center', padding: '22px' }}>
          A carregar mais resultados…
        </p>
      ) : null}
      {!loading && !loadingMore && items.length > 0 && !cursor ? (
        <p className="muted" style={{ textAlign: 'center', padding: '22px' }}>
          Fim dos resultados.
        </p>
      ) : null}
    </div>
  );
}
