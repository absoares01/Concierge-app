-- =====================================================================
-- Concierge · Soares pelo Mundo — banco de dados (Supabase / Postgres)
-- Cole no Supabase: SQL Editor > New query > Run. Pode rodar de novo.
--
-- Dois papéis:
--   equipe  → acesso total a tudo.
--   cliente → só LÊ as viagens publicadas que a equipe associou a ele.
-- Quem decide o que cada um vê é o próprio banco (Row Level Security),
-- não a tela: mesmo que alguém tente acessar outro endereço, o banco recusa.
-- =====================================================================

-- ---------- Perfis (papel de cada login) ----------
create table if not exists public.perfis (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  nome       text,
  papel      text not null default 'cliente' check (papel in ('equipe', 'cliente')),
  criado_em  timestamptz not null default now()
);

-- Todo login novo nasce como "cliente" (o papel mais restrito).
-- Para tornar alguém da equipe:  update public.perfis set papel = 'equipe' where user_id = '<id>';
create or replace function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (user_id, nome)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil();

-- Funções auxiliares usadas pelas regras. "security definer" para lerem as
-- tabelas sem esbarrar nas próprias regras (evita recursão).
create or replace function public.eh_equipe()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.perfis where user_id = auth.uid() and papel = 'equipe');
$$;

-- ---------- Clientes ----------
create table if not exists public.clientes (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  email           text,
  telefone        text,
  notas_internas  text,                         -- só a equipe vê (o cliente não lê esta tabela)
  user_id         uuid unique references auth.users(id) on delete set null,  -- login do cliente, quando liberado
  criado_por      uuid default auth.uid(),
  criado_em       timestamptz not null default now()
);

create or replace function public.meus_clientes()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.clientes where user_id = auth.uid() and auth.uid() is not null;
$$;

-- ---------- Viagens ----------
create table if not exists public.viagens (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      uuid not null references public.clientes(id) on delete cascade,
  titulo          text not null,
  destino         text,
  data_ida        date,
  data_volta      date,
  viajantes       text,                          -- ex.: "2 adultos"
  pacote          text check (pacote in ('essencial', 'completo', 'premium')),
  status          text not null default 'rascunho'
                  check (status in ('rascunho', 'publicada', 'concluida')),
  orcamento_teto  numeric,                       -- teto informado pelo cliente (R$)
  mensagem        text,                          -- recado da equipe, visível ao cliente
  criado_por      uuid default auth.uid(),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);
create index if not exists viagens_cliente_idx on public.viagens (cliente_id);

create or replace function public.viagens_visiveis()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select v.id from public.viagens v
  where v.status in ('publicada', 'concluida')
    and v.cliente_id in (select public.meus_clientes());
$$;

-- ---------- Itens da viagem (voos, hospedagem, passeios, roteiro...) ----------
-- Tudo aqui é conteúdo para o cliente. Não guarde anotações internas nesta tabela.
create table if not exists public.itens_viagem (
  id              uuid primary key default gen_random_uuid(),
  viagem_id       uuid not null references public.viagens(id) on delete cascade,
  tipo            text not null check (tipo in ('voo', 'hospedagem', 'passeio', 'transporte', 'seguro', 'atividade', 'outro')),
  titulo          text not null,
  descricao       text,
  data            date,
  hora            text,                          -- "HH:MM"
  data_fim        date,
  local           text,
  preco           numeric,                       -- valor em dinheiro (moeda abaixo)
  moeda           text not null default 'BRL',
  preco_ref       text check (preco_ref in ('total', 'pessoa', 'noite')),
  milhas          integer,                       -- emissão com milhas (cotação)
  programa        text,                          -- ex.: "LATAM Pass"
  taxas           numeric,                       -- taxas pagas na emissão com milhas (R$)
  link_compra     text,
  fonte           text,                          -- ex.: "Google Flights via SerpApi", "cotação manual"
  consultado_em   timestamptz,
  situacao        text not null default 'sugestao' check (situacao in ('sugestao', 'recomendado', 'reservado')),
  visivel_cliente boolean not null default true,
  ordem           integer not null default 0,
  dados           jsonb,                         -- dados brutos da busca (para conferência)
  criado_em       timestamptz not null default now()
);
create index if not exists itens_viagem_idx on public.itens_viagem (viagem_id, data, hora);

-- ---------- Checklist (documentos e orientações) ----------
create table if not exists public.checklist_viagem (
  id         uuid primary key default gen_random_uuid(),
  viagem_id  uuid not null references public.viagens(id) on delete cascade,
  texto      text not null,
  estado     text not null default 'pendente' check (estado in ('ok', 'pendente', 'atencao')),
  fonte_url  text,
  ordem      integer not null default 0,
  criado_em  timestamptz not null default now()
);
create index if not exists checklist_viagem_idx on public.checklist_viagem (viagem_id);

-- ---------- Segurança por linha ----------
alter table public.perfis           enable row level security;
alter table public.clientes         enable row level security;
alter table public.viagens          enable row level security;
alter table public.itens_viagem     enable row level security;
alter table public.checklist_viagem enable row level security;

-- Remove regras antigas com os mesmos nomes (permite rodar o arquivo de novo).
drop policy if exists perfis_ler        on public.perfis;
drop policy if exists perfis_equipe     on public.perfis;
drop policy if exists clientes_equipe   on public.clientes;
drop policy if exists viagens_equipe    on public.viagens;
drop policy if exists viagens_cliente   on public.viagens;
drop policy if exists itens_equipe      on public.itens_viagem;
drop policy if exists itens_cliente     on public.itens_viagem;
drop policy if exists checklist_equipe  on public.checklist_viagem;
drop policy if exists checklist_cliente on public.checklist_viagem;

-- Perfis: cada um lê o próprio; a equipe lê e altera todos. Ninguém muda o próprio papel.
create policy perfis_ler    on public.perfis for select to authenticated using (user_id = auth.uid() or public.eh_equipe());
create policy perfis_equipe on public.perfis for update to authenticated using (public.eh_equipe()) with check (public.eh_equipe());

-- Clientes: só a equipe (o cliente não lê esta tabela, para não ver notas internas).
create policy clientes_equipe on public.clientes for all to authenticated using (public.eh_equipe()) with check (public.eh_equipe());

-- Viagens: equipe faz tudo; cliente só lê as próprias já publicadas.
create policy viagens_equipe  on public.viagens for all    to authenticated using (public.eh_equipe()) with check (public.eh_equipe());
create policy viagens_cliente on public.viagens for select to authenticated using (id in (select public.viagens_visiveis()));

-- Itens: equipe faz tudo; cliente lê os itens visíveis das próprias viagens publicadas.
create policy itens_equipe  on public.itens_viagem for all    to authenticated using (public.eh_equipe()) with check (public.eh_equipe());
create policy itens_cliente on public.itens_viagem for select to authenticated using (visivel_cliente and viagem_id in (select public.viagens_visiveis()));

-- Checklist: equipe faz tudo; cliente lê o das próprias viagens publicadas.
create policy checklist_equipe  on public.checklist_viagem for all    to authenticated using (public.eh_equipe()) with check (public.eh_equipe());
create policy checklist_cliente on public.checklist_viagem for select to authenticated using (viagem_id in (select public.viagens_visiveis()));

-- Visitantes sem login não acessam nada.
revoke all on public.perfis, public.clientes, public.viagens, public.itens_viagem, public.checklist_viagem from anon;
