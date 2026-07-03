create extension if not exists "pgcrypto";

create table if not exists public.catalog_items (
  id text primary key,
  type text not null check (type in ('product', 'combo', 'offer')),
  name text not null,
  tag text default '',
  detail text default '',
  description text default '',
  start_date date,
  end_date date,
  sauce_mode text default 'free',
  fixed_sauce text default '',
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sauces (
  id text primary key,
  type text default 'sauce',
  name text not null,
  tag text default 'Salsa',
  detail text default '',
  description text default '',
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text default '',
  customer_address text default '',
  notes text default '',
  channel text default 'manual',
  status text default 'generated',
  message text not null,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists catalog_items_updated_at on public.catalog_items;
create trigger catalog_items_updated_at
before update on public.catalog_items
for each row
execute function public.set_updated_at();

drop trigger if exists sauces_updated_at on public.sauces;
create trigger sauces_updated_at
before update on public.sauces
for each row
execute function public.set_updated_at();

alter table public.catalog_items enable row level security;
alter table public.sauces enable row level security;
alter table public.orders enable row level security;

drop policy if exists "Public can read active catalog" on public.catalog_items;
create policy "Public can read active catalog"
on public.catalog_items
for select
to anon
using (is_active = true);

drop policy if exists "Public can read active sauces" on public.sauces;
create policy "Public can read active sauces"
on public.sauces
for select
to anon
using (is_active = true);

drop policy if exists "Public can create orders" on public.orders;
create policy "Public can create orders"
on public.orders
for insert
to anon
with check (true);

-- Politicas practicas para el panel actual de gestion.
-- Importante: esto permite que la clave publica del navegador cree, edite y elimine
-- productos, salsas, combos y ofertas. Para produccion conviene migrar el panel a
-- Supabase Auth y reemplazar estas politicas por reglas solo para usuarios autenticados.

drop policy if exists "Anon can manage catalog demo" on public.catalog_items;
create policy "Anon can manage catalog demo"
on public.catalog_items
for all
to anon
using (true)
with check (true);

drop policy if exists "Anon can manage sauces demo" on public.sauces;
create policy "Anon can manage sauces demo"
on public.sauces
for all
to anon
using (true)
with check (true);
