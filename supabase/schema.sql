-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase.
-- Ele cria as duas tabelas do sistema e garante que cada usuario
-- so consegue ver e editar os proprios registros (Row Level Security).

create table if not exists aves (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists despesas (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table aves enable row level security;
alter table despesas enable row level security;

create policy "usuario ve suas proprias aves"
  on aves for select using (auth.uid() = user_id);
create policy "usuario insere suas proprias aves"
  on aves for insert with check (auth.uid() = user_id);
create policy "usuario atualiza suas proprias aves"
  on aves for update using (auth.uid() = user_id);
create policy "usuario remove suas proprias aves"
  on aves for delete using (auth.uid() = user_id);

create policy "usuario ve suas proprias despesas"
  on despesas for select using (auth.uid() = user_id);
create policy "usuario insere suas proprias despesas"
  on despesas for insert with check (auth.uid() = user_id);
create policy "usuario atualiza suas proprias despesas"
  on despesas for update using (auth.uid() = user_id);
create policy "usuario remove suas proprias despesas"
  on despesas for delete using (auth.uid() = user_id);

create index if not exists aves_user_id_idx on aves(user_id);
create index if not exists despesas_user_id_idx on despesas(user_id);
