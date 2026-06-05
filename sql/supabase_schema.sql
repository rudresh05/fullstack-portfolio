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

-- THE JOURNALS TABLE
create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (date)
);

-- Safe migrations for existing tables.
alter table public.settings add column if not exists updated_at timestamptz not null default now();

alter table public.projects add column if not exists image_url text not null default '';
alter table public.projects add column if not exists updated_at timestamptz not null default now();

alter table public.blogs add column if not exists slug text not null default '';
alter table public.blogs add column if not exists content text not null default '';
alter table public.blogs add column if not exists updated_at timestamptz not null default now();

-- Ensure Journals has the unique date constraint (fixes existing tables)
do $$
begin
    if not exists (
        select 1 from pg_constraint 
        where conname = 'journals_date_key'
    ) then
        alter table public.journals add constraint journals_date_key unique (date);
    end if;
end $$;

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

drop trigger if exists set_journals_updated_at on public.journals;
create trigger set_journals_updated_at
before update on public.journals
for each row execute function public.set_updated_at();

-- Indexes.
create index if not exists idx_projects_created_at on public.projects(created_at desc);
create index if not exists idx_blogs_created_at on public.blogs(created_at desc);
create index if not exists idx_journals_date on public.journals(date desc);
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
alter table public.journals enable row level security;

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

drop policy if exists "Public read journals" on public.journals;
create policy "Public read journals"
on public.journals for select
using (true);
