# PrecoPerto

Plataforma V1 para descobrir produtos e serviços próximos, consultar preços e
publicar perfis de estabelecimentos.

A especificação completa está em [`docs/spec.md`](docs/spec.md). A implementação
vive na pasta [`project/`](project/) e é um monorepo pnpm/Turborepo com Next.js,
Expo/React Native e Supabase.

## Estado da implementação

- Web: Next.js 16 + App Router + React 19.
- Mobile: Expo SDK 57 + React Native + Expo Router.
- Backend: Supabase Auth/PostgreSQL/PostGIS/Storage/RLS, sem ORM.
- Packages: contratos, schemas, utilitários, cliente Supabase e backend server-only.
- Testes: Vitest para packages/web, Jest + RNTL para mobile e pgTAP para a base de dados.
- CI: lint, type-check, testes, builds e validação Supabase isolada.

## Requisitos

- Node.js 22.13 ou superior (o CI usa Node 24.21 LTS).
- pnpm 9.12.3 (versionado em `project/package.json`).
- Docker apenas para a validação local/CI do Supabase; a aplicação usa o projecto remoto.

## Início rápido

```bash
cd project
pnpm install
cp .env.example .env.local
pnpm dev
```

O comando `pnpm dev` arranca a Web. Para o mobile, noutro terminal:

```bash
cd project/apps/mobile
cp .env.example .env
pnpm start
```

O projecto Supabase remoto é o alvo de runtime. Crie o projecto, active PostGIS e
confirmeção de email, preencha as variáveis e aplique as migrations:

```bash
cd project
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
```

Depois de um utilizador registar e confirmar o email, promova o primeiro admin:

```bash
pnpm admin:promote admin@example.com
```

O comando exige `SUPABASE_URL` e `SUPABASE_SECRET_KEY` (ou a chave legada
`SUPABASE_SERVICE_ROLE_KEY`) no ambiente do processo. Nunca colocar uma chave
servidor em `NEXT_PUBLIC_*` ou `EXPO_PUBLIC_*`.

## Comandos de qualidade

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

O build de validação do mobile é `pnpm --filter @precoperto/mobile build` (export web sem minificação, para ser determinístico em recursos limitados); `build:production` activa a minificação normal do Expo.
Builds nativos exigem Android/iOS SDK e não substituem uma exportação web.

## Estrutura

- `project/apps/web` — aplicação web e route handlers.
- `project/apps/mobile` — aplicação Expo Router.
- `project/packages/types` — tipos de domínio e base de dados.
- `project/packages/schemas` — validação Zod com mensagens em português.
- `project/packages/utils` — helpers puros e seguros para Web/Native.
- `project/packages/supabase` — operações client-safe e queries RLS.
- `project/packages/backend` — operações server-only e CLI administrativa.
- `project/supabase` — migrations, RLS, PostGIS, Storage, seed e testes.
- `.plans/` — plano local ignorado pelo Git; não é publicado.

Cada workspace tem um `AGENTS.md` com as convenções e limites específicos.
