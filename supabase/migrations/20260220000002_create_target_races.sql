-- ============================================
-- CREATE TARGET RACES TABLE
-- Stores user's planned/target races
-- ============================================

create table if not exists public.target_races (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  distance text not null,
  date text not null,
  target_time text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_target_races_user_id on public.target_races(user_id);
create index if not exists idx_target_races_user_date on public.target_races(user_id, date asc);

-- Updated_at trigger
create trigger update_target_races_updated_at
  before update on public.target_races
  for each row execute function public.update_updated_at_column();

-- RLS
alter table public.target_races enable row level security;

create policy "Users can view own target races"
  on public.target_races for select
  using (auth.uid() = user_id);

create policy "Users can insert own target races"
  on public.target_races for insert
  with check (auth.uid() = user_id);

create policy "Users can update own target races"
  on public.target_races for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own target races"
  on public.target_races for delete
  using (auth.uid() = user_id);
