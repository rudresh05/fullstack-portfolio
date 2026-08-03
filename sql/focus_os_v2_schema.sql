-- Focus OS: Mission Execution System Schema (v2.1)
-- Optimized for hybrid Firebase Auth / Supabase DB environments

-- 1. Operator Profile & Global Stats
create table if not exists public.focus_operator (
  id text primary key, -- Firebase UID
  name text not null,
  global_integrity integer default 100,
  current_mission_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Missions (The Active Campaign)
create table if not exists public.focus_missions (
  id uuid primary key default gen_random_uuid(),
  operator_id text, -- Firebase UID
  title text not null,
  description text,
  duration_days integer not null,
  start_date timestamptz not null default now(),
  status text not null check (status in ('PLANNING', 'ACTIVE', 'ACCOMPLISHED', 'ABANDONED')),
  integrity_score integer default 100,
  completion_percentage integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Objectives (Tactical Milestones)
create table if not exists public.focus_objectives (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references public.focus_missions(id) on delete cascade,
  title text not null,
  status text not null check (status in ('STANDBY', 'ENGAGED', 'SECURED')),
  priority integer default 0,
  secured_at timestamptz,
  created_at timestamptz default now()
);

-- 4. Protocols (Engagement Rules)
create table if not exists public.focus_protocols (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references public.focus_missions(id) on delete cascade,
  description text not null,
  created_at timestamptz default now()
);

-- 5. Execution Reports (Daily Intelligence Reports)
create table if not exists public.focus_execution_reports (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references public.focus_missions(id) on delete cascade,
  date date not null,
  work_produced text,
  alignment_score integer check (alignment_score between 1 and 10),
  deep_work_hours decimal,
  integrity_maintained boolean default true,
  distractions text,
  created_at timestamptz default now(),
  unique(mission_id, date)
);

-- 6. Parking Lot (Intelligence Quarantine)
create table if not exists public.focus_parking_lot (
  id uuid primary key default gen_random_uuid(),
  operator_id text, -- Firebase UID
  title text not null,
  category text not null,
  description text,
  status text not null check (status in ('COOLING', 'RESEARCHING', 'VALIDATING', 'APPROVED', 'REJECTED', 'ARCHIVED')),
  validation_score integer default 0,
  cooldown_until timestamptz not null,
  created_at timestamptz default now()
);

-- Migrations for existing tables if they were created with old schema
ALTER TABLE public.focus_missions ALTER COLUMN operator_id TYPE text;
ALTER TABLE public.focus_parking_lot ALTER COLUMN operator_id TYPE text;
ALTER TABLE public.focus_operator ALTER COLUMN id TYPE text;

-- Enable RLS (though we primarily use supabaseAdmin for these API routes)
alter table public.focus_operator enable row level security;
alter table public.focus_missions enable row level security;
alter table public.focus_objectives enable row level security;
alter table public.focus_protocols enable row level security;
alter table public.focus_execution_reports enable row level security;
alter table public.focus_parking_lot enable row level security;

-- Setup basic policies for client-side access if needed
create policy "Allow all for admin key" on public.focus_missions for all using (true);
create policy "Allow all for admin key obj" on public.focus_objectives for all using (true);
create policy "Allow all for admin key prot" on public.focus_protocols for all using (true);
create policy "Allow all for admin key rep" on public.focus_execution_reports for all using (true);
create policy "Allow all for admin key park" on public.focus_parking_lot for all using (true);

