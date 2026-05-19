-- Ejecutar en Supabase Dashboard → SQL Editor

create table if not exists budgets (
  id text primary key,
  data jsonb not null,
  updated_at bigint not null default 0
);

create table if not exists clients (
  id text primary key,
  name text not null,
  address text default '',
  property_type text default '',
  updated_at bigint not null default 0
);

-- Permitir acceso anónimo (ajustar RLS según necesites)
alter table budgets enable row level security;
alter table clients enable row level security;

create policy "allow all" on budgets for all using (true) with check (true);
create policy "allow all" on clients for all using (true) with check (true);
