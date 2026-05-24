-- Supabase schema for Rudresh portfolio.
-- Run this whole file in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.settings (
  key text primary key,
  value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  description text not null default '',
  tech jsonb not null default '[]'::jsonb,
  link text not null default '#',
  image_url text not null default '',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blogs (
  id uuid primary key default gen_random_uuid(),
  slug text not null default '',
  title text not null default '',
  excerpt text not null default '',
  content text not null default '',
  date date,
  read_time text not null default '5 min read',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe migrations for existing tables.
alter table public.settings add column if not exists updated_at timestamptz not null default now();

alter table public.projects add column if not exists image_url text not null default '';
alter table public.projects add column if not exists updated_at timestamptz not null default now();
alter table public.projects alter column title set default '';
alter table public.projects alter column description set default '';
alter table public.projects alter column tech set default '[]'::jsonb;
alter table public.projects alter column link set default '#';
alter table public.projects alter column image_url set default '';
alter table public.projects alter column featured set default false;

alter table public.blogs add column if not exists slug text not null default '';
alter table public.blogs add column if not exists content text not null default '';
alter table public.blogs add column if not exists updated_at timestamptz not null default now();
alter table public.blogs alter column slug set default '';
alter table public.blogs alter column title set default '';
alter table public.blogs alter column excerpt set default '';
alter table public.blogs alter column content set default '';
alter table public.blogs alter column read_time set default '5 min read';

-- Backfill slugs/content for old rows.
update public.blogs
set slug = regexp_replace(lower(trim(title)), '[^a-z0-9]+', '-', 'g')
where slug is null or slug = '';

update public.blogs
set slug = regexp_replace(slug, '(^-+|-+$)', '', 'g')
where slug like '-%' or slug like '%-';

update public.blogs
set content = excerpt
where (content is null or content = '') and excerpt is not null;

-- Keep updated_at fresh.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_settings_updated_at on public.settings;
create trigger set_settings_updated_at
before update on public.settings
for each row execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_blogs_updated_at on public.blogs;
create trigger set_blogs_updated_at
before update on public.blogs
for each row execute function public.set_updated_at();

-- Indexes.
create index if not exists idx_projects_created_at on public.projects(created_at desc);
create index if not exists idx_blogs_created_at on public.blogs(created_at desc);
create index if not exists idx_blogs_slug on public.blogs(slug);

-- Media storage bucket for future image uploads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media',
  'portfolio-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public reads. Studio writes should go through Next.js API routes with
-- SUPABASE_SERVICE_ROLE_KEY in production.
alter table public.settings enable row level security;
alter table public.projects enable row level security;
alter table public.blogs enable row level security;

drop policy if exists "Public read settings" on public.settings;
create policy "Public read settings"
on public.settings for select
using (true);

drop policy if exists "Public read projects" on public.projects;
create policy "Public read projects"
on public.projects for select
using (true);

drop policy if exists "Public read blogs" on public.blogs;
create policy "Public read blogs"
on public.blogs for select
using (true);

-- Optional local-dev only, if you do not have SUPABASE_SERVICE_ROLE_KEY set:
-- alter table public.settings disable row level security;
-- alter table public.projects disable row level security;
-- alter table public.blogs disable row level security;
