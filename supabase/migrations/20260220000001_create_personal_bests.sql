-- ============================================
-- CREATE PERSONAL BESTS TABLE
-- Stores user personal records for running distances
-- ============================================

create table if not exists public.personal_bests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  distance text not null,
  time text not null,
  date text,
  custom_distance_km numeric(6,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_personal_bests_user_id on public.personal_bests(user_id);
create index if not exists idx_personal_bests_user_date on public.personal_bests(user_id, date desc);

-- Updated_at trigger
create trigger update_personal_bests_updated_at
  before update on public.personal_bests
  for each row execute function public.update_updated_at_column();

-- RLS
alter table public.personal_bests enable row level security;

create policy "Users can view own personal bests"
  on public.personal_bests for select
  using (auth.uid() = user_id);

create policy "Users can insert own personal bests"
  on public.personal_bests for insert
  with check (auth.uid() = user_id);

create policy "Users can update own personal bests"
  on public.personal_bests for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own personal bests"
  on public.personal_bests for delete
  using (auth.uid() = user_id);
