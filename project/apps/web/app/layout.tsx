import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { getCurrentAuthUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: {
    default: 'PrecoPerto — Preços perto de si',
    template: '%s | PrecoPerto',
  },
  description: 'Descubra produtos e serviços próximos e consulte preços.',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentAuthUser();

  return (
    <html lang="pt-AO">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <Link className="brand" href="/" aria-label="PrecoPerto, página inicial">
              <span className="brand-mark" aria-hidden="true">
                P
              </span>
              <span>PrecoPerto</span>
            </Link>
            <form className="header-search" action="/" method="get">
              <label className="sr-only" htmlFor="header-search">
                Pesquisar produtos e serviços
              </label>
              <input id="header-search" name="q" placeholder="Pesquisar produtos e serviços" />
              <button type="submit" aria-label="Pesquisar">
                ⌕
              </button>
            </form>
            <nav className="header-actions" aria-label="Navegação principal">
              {user ? (
                <>
                  <Link className="text-link" href="/my/profile">
                    Perfil
                  </Link>
                  <form action="/api/auth/logout" method="post">
                    <button className="button button-ghost button-small" type="submit">
                      Sair
                    </button>
                  </form>
                </>
              ) : (
                <Link className="button button-primary button-small" href="/login">
                  Entrar
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="site-main">{children}</main>
        <nav className="mobile-tabbar" aria-label="Navegação móvel">
          <Link href="/">Explorar</Link>
          <Link href={user ? '/my/profile' : '/login'}>Perfil</Link>
        </nav>
      </body>
    </html>
  );
}
