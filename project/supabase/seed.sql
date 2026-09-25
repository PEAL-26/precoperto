-- Global categories for a new PrecoPerto environment.
insert into public.categories (name, description)
select 'Alimentação', 'Produtos alimentares e bebidas'
where not exists (select 1 from public.categories where lower(name) = 'alimentação');

insert into public.categories (name, description)
select 'Serviços', 'Serviços问答 publicados por estabelecimentos'
where not exists (select 1 from public.categories where lower(name) = 'serviços');

insert into public.categories (name, description)
select 'Casa e Jardim', 'Produtos para casa e jardim'
where not exists (select 1 from public.categories where lower(name) = 'casa e jardim');

insert into public.categories (name, description)
select 'Tecnologia', 'Equipamentos e serviços tecnológicos'
where not exists (select 1 from public.categories where lower(name) = 'tecnologia');
