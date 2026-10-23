-- CRM LG — ejecutar una vez en Supabase Dashboard → SQL Editor.
-- Es idempotente: se puede correr de nuevo sin romper nada.

-- Columnas que usa la app hoy y no estaban en supabase-schema.sql
alter table budgets  add column if not exists archived boolean not null default false;
alter table clients  add column if not exists phone text default '';
alter table clients  add column if not exists notes text default '';

create table if not exists receipts (
  id text primary key,
  data jsonb not null,
  updated_at bigint not null default 0,
  archived boolean not null default false
);

-- Registros del CRM: obras, movimientos de caja, deudas, stock, garantías.
-- kind = 'obras' | 'movements' | 'debts' | 'stock_items' | 'stock_moves' | 'warranties'
create table if not exists crm_records (
  id text primary key,
  kind text not null,
  data jsonb not null,
  updated_at bigint not null default 0,
  archived boolean not null default false
);
create index if not exists crm_records_kind_idx on crm_records (kind);

alter table receipts    enable row level security;
alter table crm_records enable row level security;

do $$ begin
  create policy "allow all" on receipts for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "allow all" on crm_records for all using (true) with check (true);
exception when duplicate_object then null; end $$;
