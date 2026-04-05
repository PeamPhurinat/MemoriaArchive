create extension if not exists "pgcrypto";

-- ============================================================
-- Storage bucket for project media (photos, videos, audio)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-media',
  'project-media',
  true,
  209715200, -- 200 MB per file
  array[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
    'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/webm', 'audio/ogg'
  ]
)
on conflict (id) do nothing;

-- Public read so stored URLs work without auth
drop policy if exists "Public can read project media" on storage.objects;
create policy "Public can read project media"
  on storage.objects for select
  to public
  using (bucket_id = 'project-media');

-- Authenticated users can upload into their own folder (client-side uploads)
drop policy if exists "Users can upload own project media" on storage.objects;
create policy "Users can upload own project media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Authenticated users can delete their own files
drop policy if exists "Users can delete own project media" on storage.objects;
create policy "Users can delete own project media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'project-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create table if not exists public.projects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New Project',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists projects_user_id_updated_at_idx
  on public.projects (user_id, updated_at desc);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_projects_updated_at on public.projects;

create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at_timestamp();

-- Allow sharing a project publicly
alter table public.projects
  add column if not exists is_shared boolean not null default false;

alter table public.projects enable row level security;

drop policy if exists "Users can read own projects" on public.projects;
create policy "Users can read own projects"
  on public.projects
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own projects" on public.projects;
create policy "Users can create own projects"
  on public.projects
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own projects" on public.projects;
create policy "Users can update own projects"
  on public.projects
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own projects" on public.projects;
create policy "Users can delete own projects"
  on public.projects
  for delete
  using (auth.uid() = user_id);

-- Allow anyone to read projects that have been shared
drop policy if exists "Public can read shared projects" on public.projects;
create policy "Public can read shared projects"
  on public.projects
  for select
  using (is_shared = true);

create table if not exists public.user_layouts (
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  theme text not null default 'dream',
  components jsonb not null default '{}'::jsonb,
  layout_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, project_id)
);

-- Add columns to existing tables (safe to run multiple times)
alter table public.user_layouts
  add column if not exists theme text not null default 'dream',
  add column if not exists components jsonb not null default '{}'::jsonb;

create index if not exists user_layouts_user_updated_idx
  on public.user_layouts (user_id, updated_at desc);

drop trigger if exists set_user_layouts_updated_at on public.user_layouts;

create trigger set_user_layouts_updated_at
before update on public.user_layouts
for each row
execute function public.set_updated_at_timestamp();

alter table public.user_layouts enable row level security;

drop policy if exists "Users can read own layouts" on public.user_layouts;
create policy "Users can read own layouts"
  on public.user_layouts
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own layouts" on public.user_layouts;
create policy "Users can create own layouts"
  on public.user_layouts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own layouts" on public.user_layouts;
create policy "Users can update own layouts"
  on public.user_layouts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own layouts" on public.user_layouts;
create policy "Users can delete own layouts"
  on public.user_layouts
  for delete
  using (auth.uid() = user_id);

-- Allow anyone to read layouts whose project is shared
drop policy if exists "Public can read layouts of shared projects" on public.user_layouts;
create policy "Public can read layouts of shared projects"
  on public.user_layouts
  for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.is_shared = true
    )
  );
