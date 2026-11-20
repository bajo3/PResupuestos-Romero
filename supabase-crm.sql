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

-- ─── Listado de presupuestos liviano (sin fotos) ─────────────────────────────
-- Las fotos (base64) hacían pesar ~12 MB al listado y en un celular nuevo no terminaba de cargar.
create or replace function public.budgets_light()
returns table(id text, archived boolean, updated_at bigint, data jsonb)
language sql stable as $$
  select b.id, b.archived, b.updated_at,
    case when b.archived then '{}'::jsonb
         else (b.data - 'photos') || jsonb_build_object('photoCount',
              case when jsonb_typeof(b.data->'photos') = 'array' then jsonb_array_length(b.data->'photos') else 0 end)
    end
  from public.budgets b
$$;

create or replace function public.budget_photos(p_id text)
returns jsonb
language sql stable as $$
  select case when jsonb_typeof(data->'photos') = 'array' then data->'photos' else '[]'::jsonb end
  from public.budgets where id = p_id
$$;

create or replace function public.upsert_budget(p_id text, p_data jsonb, p_archived boolean, p_updated_at bigint)
returns void
language plpgsql as $$
begin
  insert into public.budgets(id, data, archived, updated_at)
  values (p_id, p_data, p_archived, p_updated_at)
  on conflict (id) do update set
    data = case
      when p_data ? 'photos' then excluded.data
      else excluded.data || jsonb_build_object('photos', coalesce(public.budgets.data->'photos', '[]'::jsonb))
    end,
    archived = excluded.archived,
    updated_at = excluded.updated_at;
end;
$$;

grant execute on function public.budgets_light() to anon, authenticated;
grant execute on function public.budget_photos(text) to anon, authenticated;
grant execute on function public.upsert_budget(text, jsonb, boolean, bigint) to anon, authenticated;
