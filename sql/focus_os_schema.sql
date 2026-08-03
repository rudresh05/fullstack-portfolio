-- Focus OS Tables

-- 1. Create tables if they don't exist
create table if not exists public.focus_sprints (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  goal text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default true,
  is_completed boolean not null default false,
  tasks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.focus_ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Other',
  description text,
  status text not null default 'New',
  validation_score integer not null default 0,
  questionnaire jsonb default '{}'::jsonb,
  customer_validation jsonb default '{
    "contacted": 0,
    "calls": 0,
    "emails": 0,
    "meetings": 0,
    "positiveResponses": 0,
    "negativeResponses": 0,
    "notes": ""
  }'::jsonb,
  overrides_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.focus_tracking (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  tasks jsonb not null default '[]'::jsonb,
  score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(date)
);

create table if not exists public.focus_reviews (
  id uuid primary key default gen_random_uuid(),
  sprint_id uuid references public.focus_sprints(id),
  week_number integer not null,
  what_worked text,
  what_failed text,
  biggest_distraction text,
  next_week_focus text,
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Safely add columns if the tables already existed before (Migration)
ALTER TABLE public.focus_sprints ADD COLUMN IF NOT EXISTS tasks jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.focus_ideas ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'New';
ALTER TABLE public.focus_ideas ADD COLUMN IF NOT EXISTS validation_score integer NOT NULL DEFAULT 0;
ALTER TABLE public.focus_ideas ADD COLUMN IF NOT EXISTS questionnaire jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.focus_ideas ADD COLUMN IF NOT EXISTS customer_validation jsonb DEFAULT '{
    "contacted": 0,
    "calls": 0,
    "emails": 0,
    "meetings": 0,
    "positiveResponses": 0,
    "negativeResponses": 0,
    "notes": ""
  }'::jsonb;
ALTER TABLE public.focus_ideas ADD COLUMN IF NOT EXISTS overrides_count integer NOT NULL DEFAULT 0;

-- 3. Enable RLS
alter table public.focus_sprints enable row level security;
alter table public.focus_ideas enable row level security;
alter table public.focus_tracking enable row level security;
alter table public.focus_reviews enable row level security;

-- 4. Safely setup policies (drop existing ones first to avoid "already exists" errors)
drop policy if exists "Public read focus_sprints" on public.focus_sprints;
drop policy if exists "Public read focus_ideas" on public.focus_ideas;
drop policy if exists "Public read focus_tracking" on public.focus_tracking;
drop policy if exists "Public read focus_reviews" on public.focus_reviews;

drop policy if exists "Admin insert focus_sprints" on public.focus_sprints;
drop policy if exists "Admin update focus_sprints" on public.focus_sprints;
drop policy if exists "Admin insert focus_ideas" on public.focus_ideas;
drop policy if exists "Admin update focus_ideas" on public.focus_ideas;
drop policy if exists "Admin delete focus_ideas" on public.focus_ideas;
drop policy if exists "Admin insert focus_tracking" on public.focus_tracking;
drop policy if exists "Admin update focus_tracking" on public.focus_tracking;
drop policy if exists "Admin insert focus_reviews" on public.focus_reviews;
drop policy if exists "Admin update focus_reviews" on public.focus_reviews;

create policy "Public read focus_sprints" on public.focus_sprints for select using (true);
create policy "Public read focus_ideas" on public.focus_ideas for select using (true);
create policy "Public read focus_tracking" on public.focus_tracking for select using (true);
create policy "Public read focus_reviews" on public.focus_reviews for select using (true);

create policy "Admin insert focus_sprints" on public.focus_sprints for insert with check (true);
create policy "Admin update focus_sprints" on public.focus_sprints for update using (true);
create policy "Admin insert focus_ideas" on public.focus_ideas for insert with check (true);
create policy "Admin update focus_ideas" on public.focus_ideas for update using (true);
create policy "Admin delete focus_ideas" on public.focus_ideas for delete using (true);
create policy "Admin insert focus_tracking" on public.focus_tracking for insert with check (true);
create policy "Admin update focus_tracking" on public.focus_tracking for update using (true);
create policy "Admin insert focus_reviews" on public.focus_reviews for insert with check (true);
create policy "Admin update focus_reviews" on public.focus_reviews for update using (true);

-- 5. Force schema cache reload
NOTIFY pgrst, 'reload schema';
