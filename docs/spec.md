# PrecoPerto — Especificação V1

## 1. Visão

**PrecoPerto** é uma plataforma para descobrir produtos e serviços próximos da localização do utilizador e consultar os respectivos preços.

O utilizador pesquisa um produto/serviço e recebe resultados de diferentes comerciantes/estabelecimentos, ordenados pela proximidade.

A V1 deve ser simples, funcional e preparada para evolução futura.

### Stack

* **Web:** Next.js
* **Mobile:** Expo + React Native
* **Backend:** Supabase

  * PostgreSQL
  * PostGIS
  * Supabase Auth
  * Supabase Storage
  * Row Level Security
* **Monorepo**
* Packages partilhados inicialmente:

  * `types`
  * `schemas`
  * `utils`

Não usar ORM na V1. O acesso à base de dados será feito através do **Supabase JS SDK**.

---

# 2. Terminologia

Internamente:

* `User`
* `Store`
* `Product`
* `Category`
* `StoreHours`

Na interface:

* **Utilizador**
* **Comerciante**
* **Estabelecimento**
* **Produto**
* **Serviço**
* **Categoria**

Um `Store` não pressupõe necessariamente uma loja física. Pode representar um estabelecimento ou o próprio comerciante.

Não existe entidade `Merchant`.

---

# 3. Autenticação

Usar **Supabase Auth**.

Método V1:

* Email
* Password

O `User` da aplicação deve estar relacionado com o utilizador do Supabase Auth.

### User

Campos:

```text
cuid
auth_user_id
name
email
role
created_at
updated_at
```

### Role

```text
admin
user
```

Não implementar `status`, bloqueio ou sistema de suspensão na V1.

A password não deve ser armazenada na tabela `users`; fica sob responsabilidade do Supabase Auth.

---

# 4. Store

Cada utilizador pode ter **uma única Store** na V1.

A Store é criada no processo de registo como um pré-cadastro.

O nome inicial da Store será o mesmo nome fornecido no registo do utilizador.

O utilizador pode completar ou alterar os dados posteriormente através do Perfil.

### Store

```text
cuid
user_cuid
name
description
avatar
cover
address
city
province
latitude
longitude
phone
whatsapp
email
website
social_links
is_private
created_at
updated_at
```

### Regras

* `user_cuid` é único.
* `latitude` e `longitude` são obrigatórios.
* A localização da Store pode ser a localização do estabelecimento ou do próprio comerciante.
* `is_private` é `false` por padrão.
* Store privada não aparece na exploração pública.
* Produtos de uma Store privada continuam podendo aparecer nos resultados de pesquisa.
* Não existe eliminação de Store através da interface na V1.

### Social links

Usar estrutura simples, por exemplo:

```text
facebook
instagram
tiktok
youtube
```

Pode ser armazenado como JSONB.

---

# 5. Localização da Store

A localização da Store é permanente e obrigatória.

Na V1:

* guardar `latitude`
* guardar `longitude`
* guardar `address`
* guardar `city`
* guardar `province`

Não implementar geocoding/reverse geocoding.

A localização pode ser obtida através do dispositivo/browser e depois ajustada pelo utilizador.

---

# 6. Localização do utilizador

A aplicação tenta obter a localização actual do dispositivo/browser através da API de geolocalização.

A localização do utilizador:

* não é guardada no Supabase;
* é obtida quando necessária;
* é usada apenas para pesquisa e ordenação por proximidade.

Se a localização não estiver disponível, a aplicação pode apresentar os resultados sem ordenação por distância ou solicitar novamente a permissão.

Não implementar localização manual na V1.

---

# 7. Products

Existe uma única entidade `products` para produtos e serviços.

### Product

```text
cuid
store_cuid
category_cuid
type
name
price
currency
description
cover
status
created_at
updated_at
```

### Type

```text
product
service
```

### Currency

Na V1:

```text
AOA
```

Guardar a moeda explicitamente mesmo sendo única nesta fase.

### Status

```text
active
inactive
archived
```

Regras:

* `store_cuid` obrigatório.
* Cada Product pertence a uma única Store.
* `category_cuid` obrigatório.
* Produtos podem ser desactivados sem serem eliminados.
* `archived` substitui a eliminação.
* Não existe hard delete através da interface.

---

# 8. Categories

Categorias são globais.

### Category

```text
cuid
name
description
created_at
updated_at
```

O comerciante apenas selecciona uma categoria.

A gestão de categorias pertence ao `admin`.

Não implementar categorias personalizadas por comerciante.

---

# 9. Store Hours

Horários semanais simples.

### StoreHours

```text
cuid
store_cuid
day_of_week
is_closed
open_time
close_time
```

`day_of_week`:

```text
0 = Sunday
1 = Monday
2 = Tuesday
3 = Wednesday
4 = Thursday
5 = Friday
6 = Saturday
```

Cada dia possui apenas um período.

Exemplo:

```text
Monday    08:00 - 18:00
Tuesday   08:00 - 18:00
Wednesday 08:00 - 18:00
Thursday  08:00 - 18:00
Friday    08:00 - 18:00
Saturday  08:00 - 13:00
Sunday    Closed
```

Não implementar múltiplos períodos por dia na V1.

---

# 10. Identificadores

Usar **CUID** como identificador das entidades da aplicação.

Entidades:

```text
users
stores
products
categories
store_hours
```

Os IDs internos do Supabase Auth podem continuar a utilizar o formato próprio do Supabase, mas as entidades da aplicação usam CUID.

---

# 11. Pesquisa

A pesquisa é global.

Exemplo:

```text
arroz
```

Deve retornar todos os produtos relevantes disponíveis, sem limitar a um raio.

A ordenação principal será:

```text
relevância
+
distância
```

Na V1, a pesquisa textual é simples e baseada principalmente no `name`.

A estrutura deve permitir evoluir posteriormente para pesquisa por:

```text
name
description
category
```

### Regra de proximidade

Não agrupar produtos iguais.

Exemplo:

```text
Arroz 5kg — 6.500 Kz — 1,2 km
Arroz 5kg — 6.800 Kz — 2,4 km
Arroz 5kg — 7.000 Kz — 4,8 km
```

Cada Product é apresentado individualmente.

---

# 12. Pesquisa geográfica

Usar **PostGIS** no PostgreSQL.

A Store deve possuir uma coluna geográfica derivada das coordenadas, por exemplo:

```text
location geography(Point, 4326)
```

A pesquisa deve receber:

```text
latitude
longitude
search
pagination cursor
```

e executar a ordenação por distância no PostgreSQL.

A distância deve ser calculada no backend/database e devolvida ao frontend.

Exemplo:

```text
distance_meters
```

O frontend pode converter para:

```text
1,2 km
850 m
```

---

# 13. Infinite Scroll

Explorar e pesquisar devem utilizar **infinite scroll**.

Não utilizar paginação tradicional na interface.

A API/query deve utilizar paginação incremental baseada em cursor/keyset sempre que possível.

O frontend deve carregar novos resultados conforme o utilizador se aproxima do final da lista.

---

# 14. Explorar

## Web

Rota:

```text
/
```

Página principal da aplicação.

Conteúdo:

* pesquisa;
* produtos;
* preço;
* categoria;
* distância;
* Store;
* imagem quando disponível.

A página deve estar preparada para:

```text
List
Map
```

mas a visualização em mapa fica fora da V1.

A estrutura deve permitir adicionar o mapa posteriormente sem alterar o modelo de dados.

---

# 15. Product Details

Rota:

```text
/products/[cuid]
```

Mostrar:

* cover;
* nome;
* tipo;
* preço;
* categoria;
* descrição;
* distância;
* Store;
* localização da Store;
* contactos relevantes;
* horário;
* link para a Store.

---

# 16. Public Store

Rota:

```text
/store/[cuid]
```

Mostrar:

* cover;
* avatar;
* nome;
* descrição;
* endereço;
* cidade;
* província;
* contactos;
* redes sociais;
* horário;
* localização;
* produtos/serviços activos.

A Store privada não deve aparecer na exploração.

A página pública da Store pode continuar a existir quando `is_private = true`, desde que o acesso directo seja permitido pela regra de negócio definida para a V1.

---

# 17. Perfil

Rota:

```text
/my/profile
```

Desktop:

```text
------------------------------------------------
|                  Store Cover                 |
|                    Avatar                   |
|                 Store Name                  |
------------------------------------------------

| Informações             | Produtos          |
|                         |                   |
| Utilizador              | Product Grid      |
| Contactos               |                   |
| Horários                |                   |
| Endereço                |                   |
| Redes sociais           |                   |
------------------------------------------------
```

### Coluna esquerda

* dados do utilizador;
* contactos;
* endereço;
* cidade;
* província;
* horários;
* redes sociais;
* estado público/privado da Store.

### Coluna direita

Grid de produtos/serviços da Store.

Mostrar principalmente:

```text
active
inactive
archived
```

com possibilidade de gestão pelo proprietário.

---

# 18. Modais

Na V1 não criar páginas específicas para formulários.

Cadastros e edições devem acontecer através de modais.

Exemplos:

```text
Edit Profile
Edit Store
Edit Address
Edit Contacts
Edit Social Links
Edit Store Hours
Create Product
Edit Product
```

No mobile, utilizar **Bottom Sheet** sempre que fizer sentido.

Objetivo:

> reduzir navegação e manter a aplicação simples.

---

# 19. Gestão de Products

Dentro do Perfil:

```text
Adicionar produto
```

abre modal/bottom sheet.

Campos:

```text
name
type
category
price
description
cover
status
```

Acções:

```text
Create
Edit
Activate
Deactivate
Archive
```

Não existe página `/my/products`.

---

# 20. Gestão da Store

No Perfil:

```text
Editar perfil
```

abre modal/bottom sheet.

Separar os dados em pequenas secções para evitar um formulário gigante:

```text
Informações
Localização
Contactos
Horários
Redes sociais
Privacidade
```

---

# 21. Web Navigation

## Desktop

Header único.

```text
[ PrecoPerto ]        [ Pesquisa................ ]        [ Entrar / Avatar ]
```

Elementos:

* logo à esquerda;
* pesquisa centralizada;
* Entrar quando deslogado;
* avatar quando autenticado.

Não adicionar sidebar na V1.

## Mobile

Header:

```text
[ PrecoPerto ]                         [ Pesquisa ]
```

Tabbar inferior:

```text
[ Explorar ]                         [ Perfil ]
```

A navegação mobile deve manter-se mínima.

---

# 22. Mobile

O app React Native deve reutilizar a mesma lógica de negócio do projecto web.

Estrutura inicial:

```text
apps/
  web/
  mobile/

packages/
  types/
  schemas/
  utils/
```

No mobile:

* Expo;
* React Native;
* Bottom Sheets para edição/cadastro;
* localização através das APIs do dispositivo;
* autenticação Supabase;
* mesmo backend e RLS da aplicação web.

---

# 23. Admin

Rota:

```text
/admin
```

Apenas utilizadores com:

```text
role = admin
```

podem aceder.

V1 possui apenas gestão de categorias.

### Funcionalidades

```text
List categories
Create category
Edit category
Delete category
```

Não criar dashboard complexo.

---

# 24. Supabase Storage

Usar Supabase Storage para imagens.

Buckets podem ser organizados por entidade:

```text
store-assets
product-assets
```

### Store

```text
avatar
cover
```

### Product

```text
cover
```

Todas as imagens são opcionais.

A aplicação deve funcionar correctamente quando não existir imagem.

As políticas de Storage devem permitir que o proprietário faça upload/alteração dos próprios assets.

---

# 25. RLS

RLS deve ser a principal camada de autorização.

### User

Utilizador pode consultar/editar os próprios dados.

### Store

Utilizador autenticado pode:

* criar a própria Store;
* editar a própria Store;
* editar horários;
* editar contactos;
* editar redes sociais.

Não pode editar Store de outro utilizador.

### Product

O proprietário da Store pode:

* criar;
* editar;
* alterar status;
* arquivar.

Não pode alterar Products de outra Store.

### Category

Leitura pública.

Escrita apenas para:

```text
role = admin
```

### Public data

Produtos `active` devem poder ser consultados publicamente.

Dados públicos da Store devem poder ser consultados conforme `is_private`.

---

# 26. Segurança

Nunca confiar no `role` enviado pelo frontend.

As permissões devem ser verificadas através do Supabase/RLS.

Não colocar service role key no frontend.

Variáveis públicas:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Mobile deve utilizar as respectivas configurações públicas do Supabase.

Service Role Key apenas em ambiente server-side quando absolutamente necessário.

---

# 27. Estrutura conceptual

```text
User
 │
 └── Store
      │
      ├── StoreHours
      │
      └── Products
             │
             └── Category
```

Relações:

```text
User 1 ─── 1 Store

Store 1 ─── N StoreHours

Store 1 ─── N Products

Category 1 ─── N Products
```

---

# 28. Fluxo de registo

Fluxo mínimo:

```text
Register
   ↓
name
email
password
   ↓
Create Supabase Auth user
   ↓
Create application User
   ↓
Request device/browser location
   ↓
Create Store
   ├── name = user.name
   ├── latitude
   ├── longitude
   └── is_private = false
   ↓
Entrar na aplicação
```

A Store criada é apenas um pré-cadastro.

O utilizador pode completar os restantes dados posteriormente.

---

# 29. Fluxo de pesquisa

```text
User opens Explorar
        ↓
Request location
        ↓
User searches "arroz"
        ↓
Get latitude + longitude
        ↓
PostGIS query
        ↓
Search products
        ↓
Calculate distance
        ↓
Order by proximity
        ↓
Return products
        ↓
Infinite scroll
```

Sem localização:

```text
Pesquisar
   ↓
Resultados disponíveis
   ↓
Sem distância/ordenação geográfica
```

---

# 30. Estados da interface

A aplicação deve tratar explicitamente:

```text
loading
empty
error
success
unauthenticated
location_permission_denied
```

Exemplos de mensagens visíveis devem estar sempre em português.

Código, nomes de funções, estados, entidades, rotas e variáveis permanecem em inglês.

---

# 31. Idioma

### Código

Sempre inglês:

```text
Product
Store
Category
SearchProducts
CreateProduct
isPrivate
```

### Interface

Sempre português:

```text
Pesquisar
Explorar
Perfil
Produto
Serviço
Preço
Categoria
Descrição
Guardar
Cancelar
Editar
Adicionar produto
Estabelecimento
Contactos
Horários
Endereço
```

Todas as mensagens, validações, erros e estados apresentados ao utilizador devem estar em português.

---

# 32. Validações mínimas

### User

```text
name: required
email: required + valid email
password: required
```

### Store

```text
name: required
latitude: required
longitude: required
```

### Product

```text
name: required
type: required
category: required
price: required
currency: AOA
```

### StoreHours

```text
day_of_week: required
is_closed: required
open_time: required when not closed
close_time: required when not closed
```

---

# 33. O que NÃO implementar na V1

Para manter o lançamento rápido, ficam fora:

* pagamentos;
* encomendas;
* carrinho;
* chat;
* avaliações;
* favoritos;
* notificações;
* comparação de preços;
* agregação de produtos iguais;
* múltiplas Stores por utilizador;
* múltiplas imagens por Product;
* múltiplos horários no mesmo dia;
* localização manual do utilizador;
* geocoding;
* mapa funcional na Explorar;
* gestão avançada de utilizadores;
* sistema de seguidores;
* analytics avançado;
* recomendações por IA;
* pesquisa avançada/fuzzy search;
* sistema de publicidade;
* subscrições;
* monetização.

---

# 34. Prioridade de desenvolvimento

## Fase 1 — Foundation

```text
Monorepo
Supabase
Auth
Database
RLS
Storage
Shared types
Shared schemas
```

## Fase 2 — User + Store

```text
Register
Login
Logout
Store pre-registration
Store profile
Store editing
Location
Contacts
Hours
Privacy
```

## Fase 3 — Products

```text
Categories
Create Product
Edit Product
Activate
Deactivate
Archive
Product details
```

## Fase 4 — Explore

```text
Product listing
Search
Geolocation
PostGIS
Distance
Infinite scroll
```

## Fase 5 — Public Store

```text
Store page
Store information
Contacts
Hours
Products
```

## Fase 6 — Admin

```text
Admin authentication
Category CRUD
```

## Fase 7 — Mobile

```text
Authentication
Explore
Search
Product details
Store
Profile
Bottom Sheets
Location
```

## Fase 8 — Launch hardening

```text
Validation
Error states
Loading states
Empty states
RLS review
Storage policies
Responsive behaviour
Performance
Production environment
```

---

# 35. Resultado esperado da V1

O fluxo principal deve ser:

```text
Utilizador
   ↓
Regista-se
   ↓
Store é criada automaticamente
   ↓
Entra na plataforma
   ↓
Pesquisa "arroz"
   ↓
Permite localização
   ↓
Vê produtos próximos
   ↓
Escolhe um produto
   ↓
Consulta preço + distância + Store
   ↓
Abre a Store
   ↓
Consulta contactos, horário e restantes produtos
```

Para o comerciante:

```text
Registo
   ↓
Store criada
   ↓
Perfil
   ↓
Completar informações
   ↓
Adicionar produtos/serviços
   ↓
Produtos ficam disponíveis na pesquisa
```

O objectivo da V1 é fazer este ciclo funcionar **de ponta a ponta com o mínimo de complexidade possível**. O modelo já fica preparado para adicionar posteriormente mapa, pesquisa avançada, comparação de preços, múltiplas imagens, múltiplas lojas e outras funcionalidades sem alterar o conceito central.
