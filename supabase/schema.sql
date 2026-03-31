-- Memoria user layout table
-- Run this in Supabase SQL Editor.

create table if not exists public.user_layouts (
  user_id text primary key,
  layout_data jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_layouts enable row level security;

-- Demo policies for current frontend (uses custom user_id text, no Supabase Auth yet).
-- NOTE: This is not secure for production because any client with anon key can read/write.
drop policy if exists "demo_public_read_layouts" on public.user_layouts;
create policy "demo_public_read_layouts"
  on public.user_layouts
  for select
  to anon, authenticated
  using (true);

drop policy if exists "demo_public_write_layouts" on public.user_layouts;
create policy "demo_public_write_layouts"
  on public.user_layouts
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "demo_public_update_layouts" on public.user_layouts;
create policy "demo_public_update_layouts"
  on public.user_layouts
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- Optional secure policy (requires Supabase Auth login and user_id = auth.uid()).
-- Uncomment and remove demo policies when auth is implemented:
-- drop policy if exists "demo_public_read_layouts" on public.user_layouts;
-- drop policy if exists "demo_public_write_layouts" on public.user_layouts;
-- drop policy if exists "demo_public_update_layouts" on public.user_layouts;
--
-- create policy "users_read_own_layout"
--   on public.user_layouts
--   for select
--   to authenticated
--   using (user_id = auth.uid()::text);
--
-- create policy "users_insert_own_layout"
--   on public.user_layouts
--   for insert
--   to authenticated
--   with check (user_id = auth.uid()::text);
--
-- create policy "users_update_own_layout"
--   on public.user_layouts
--   for update
--   to authenticated
--   using (user_id = auth.uid()::text)
--   with check (user_id = auth.uid()::text);
