import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page-shell narrow-page">
      <div className="empty-state">
        <span className="empty-icon" aria-hidden="true">
          ?
        </span>
        <h1>Página não encontrada</h1>
        <p>O conteúdo que procura não existe ou deixou de estar disponível.</p>
        <Link className="button button-primary" href="/">
          Voltar a explorar
        </Link>
      </div>
    </div>
  );
}
