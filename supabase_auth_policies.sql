create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "Admins can verify own access" on public.admin_users;
create policy "Admins can verify own access"
on public.admin_users
for select
to authenticated
using (user_id = (select auth.uid()));

-- Desactiva las politicas practicas de la primera integracion.
drop policy if exists "Anon can manage catalog demo" on public.catalog_items;
drop policy if exists "Anon can manage sauces demo" on public.sauces;

-- Mantiene lectura publica del catalogo activo y restringe escritura a admins.
drop policy if exists "Admins can manage catalog" on public.catalog_items;
create policy "Admins can manage catalog"
on public.catalog_items
for all
to authenticated
using ((select auth.uid()) in (select user_id from public.admin_users))
with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "Admins can manage sauces" on public.sauces;
create policy "Admins can manage sauces"
on public.sauces
for all
to authenticated
using ((select auth.uid()) in (select user_id from public.admin_users))
with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "Admins can read orders" on public.orders;
create policy "Admins can read orders"
on public.orders
for select
to authenticated
using ((select auth.uid()) in (select user_id from public.admin_users));

-- Ejecuta este bloque despues de crear el usuario en Authentication > Users.
-- Cambia el email por el usuario administrador real.
--
-- insert into public.admin_users (user_id, email)
-- select id, email
-- from auth.users
-- where email = 'TU_EMAIL_ADMIN@example.com'
-- on conflict (user_id) do update set email = excluded.email;
