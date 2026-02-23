-- Create training_plans table
create table if not exists public.training_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  plan_data jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create indexes
create index if not exists idx_training_plans_user_id on public.training_plans(user_id);
create index if not exists idx_training_plans_updated_at on public.training_plans(updated_at desc);

-- Enable Row Level Security
alter table public.training_plans enable row level security;

-- RLS Policies
create policy "Users can view own training plans"
  on public.training_plans
  for select
  using (auth.uid() = user_id);

create policy "Users can create own training plans"
  on public.training_plans
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own training plans"
  on public.training_plans
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own training plans"
  on public.training_plans
  for delete
  using (auth.uid() = user_id);

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_training_plans_updated_at
  before update on public.training_plans
  for each row
  execute function public.update_updated_at_column();
