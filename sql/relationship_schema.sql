-- Private relationship experience schema.
-- Run after sql/supabase_schema.sql. These tables deliberately have no public RLS policies.

create extension if not exists "pgcrypto";

do $$ begin create type public.relationship_role as enum ('owner', 'partner'); exception when duplicate_object then null; end $$;
do $$ begin create type public.relationship_visibility as enum ('shared', 'vault'); exception when duplicate_object then null; end $$;
do $$ begin create type public.relationship_media_type as enum ('image', 'video', 'audio'); exception when duplicate_object then null; end $$;
do $$ begin create type public.letter_access_rule as enum ('shared', 'scheduled', 'passcode', 'vault'); exception when duplicate_object then null; end $$;
do $$ begin create type public.bucket_item_status as enum ('planned', 'in_progress', 'complete'); exception when duplicate_object then null; end $$;

create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  owner_firebase_uid text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  recipient_name text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.relationship_settings (
  relationship_id uuid primary key references public.relationships(id) on delete cascade,
  hero_title text not null default '',
  hero_subtitle text not null default '',
  story_heading text not null default '',
  story_body text not null default '',
  portrait_path text,
  music_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.relationship_members (
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  firebase_uid text not null,
  display_name text not null default '',
  role public.relationship_role not null default 'partner',
  created_at timestamptz not null default now(),
  primary key (relationship_id, firebase_uid)
);

create table public.relationship_access_links (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  token_hash text not null unique,
  label text not null default 'Recipient link',
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  storage_path text not null unique,
  media_type public.relationship_media_type not null,
  mime_type text not null,
  bytes bigint not null check (bytes >= 0),
  visibility public.relationship_visibility not null default 'shared',
  width integer,
  height integer,
  duration_seconds numeric,
  created_at timestamptz not null default now()
);

create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  title text not null,
  body text not null default '',
  occurred_on date,
  location_name text,
  cover_asset_id uuid references public.media_assets(id) on delete set null,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  title text not null,
  caption text not null default '',
  narrative text not null default '',
  occurred_on date,
  location_name text,
  mood text,
  tags text[] not null default '{}',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memory_media (
  memory_id uuid not null references public.memories(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  alt_text text not null default '',
  sort_order integer not null default 0,
  primary key (memory_id, media_asset_id)
);

create table public.letters (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  title text not null,
  body text not null,
  signature text not null default '',
  access_rule public.letter_access_rule not null default 'shared',
  unlock_at timestamptz,
  passcode_hash text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((access_rule <> 'passcode') or passcode_hash is not null)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  prompt text not null,
  helper_text text,
  response_type text not null default 'long_text' check (response_type in ('short_text', 'long_text')),
  is_required boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  respondent_label text,
  response text not null check (char_length(response) <= 5000),
  submitted_at timestamptz not null default now()
);

create table public.bucket_list_items (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null default 'together',
  status public.bucket_item_status not null default 'planned',
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.future_places (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  name text not null,
  story text not null default '',
  latitude numeric(9,6),
  longitude numeric(9,6),
  is_visited boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((latitude is null and longitude is null) or (latitude is not null and longitude is not null))
);

create index idx_timeline_relationship_order on public.timeline_events(relationship_id, occurred_on, sort_order);
create index idx_memories_relationship_order on public.memories(relationship_id, occurred_on desc, sort_order);
create index idx_letters_relationship_order on public.letters(relationship_id, sort_order);
create index idx_questions_relationship_order on public.questions(relationship_id, sort_order);
create index idx_answers_relationship on public.question_answers(relationship_id, submitted_at desc);
create index idx_bucket_relationship_order on public.bucket_list_items(relationship_id, sort_order);

create or replace function public.relationship_set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists relationships_updated on public.relationships;
drop trigger if exists timeline_events_updated on public.timeline_events;
drop trigger if exists memories_updated on public.memories;
drop trigger if exists letters_updated on public.letters;
drop trigger if exists questions_updated on public.questions;
drop trigger if exists bucket_list_updated on public.bucket_list_items;
drop trigger if exists future_places_updated on public.future_places;
create trigger relationships_updated before update on public.relationships for each row execute function public.relationship_set_updated_at();
create trigger timeline_events_updated before update on public.timeline_events for each row execute function public.relationship_set_updated_at();
create trigger memories_updated before update on public.memories for each row execute function public.relationship_set_updated_at();
create trigger letters_updated before update on public.letters for each row execute function public.relationship_set_updated_at();
create trigger questions_updated before update on public.questions for each row execute function public.relationship_set_updated_at();
create trigger bucket_list_updated before update on public.bucket_list_items for each row execute function public.relationship_set_updated_at();
create trigger future_places_updated before update on public.future_places for each row execute function public.relationship_set_updated_at();

-- Private bucket. Files must be delivered with short-lived signed URLs from a server route.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('relationship-media', 'relationship-media', false, 52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'audio/mpeg', 'audio/mp4', 'audio/wav'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

alter table public.relationships enable row level security;
alter table public.relationship_settings enable row level security;
alter table public.relationship_members enable row level security;
alter table public.relationship_access_links enable row level security;
alter table public.media_assets enable row level security;
alter table public.timeline_events enable row level security;
alter table public.memories enable row level security;
alter table public.memory_media enable row level security;
alter table public.letters enable row level security;
alter table public.questions enable row level security;
alter table public.question_answers enable row level security;
alter table public.bucket_list_items enable row level security;
alter table public.future_places enable row level security;
-- No anon/authenticated policies: the browser cannot query relationship data directly.
