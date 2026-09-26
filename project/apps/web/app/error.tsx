'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-shell narrow-page">
      <div className="empty-state">
        <span className="empty-icon" aria-hidden="true">
          !
        </span>
        <h1>Algo correu mal</h1>
        <p>Não foi possível carregar esta página. Tente novamente.</p>
        {error.message ? <p className="muted">{error.message}</p> : null}
        <button className="button button-primary" onClick={reset} type="button">
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
