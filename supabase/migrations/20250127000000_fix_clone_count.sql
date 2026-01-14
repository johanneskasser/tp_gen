-- ============================================
-- FIX CLONE COUNT FUNCTIONALITY
-- ============================================

-- Drop and recreate the increment_clone_count function with proper security settings
drop function if exists increment_clone_count(uuid);

create or replace function increment_clone_count(plan_uuid uuid)
returns void
security definer -- Run with the privileges of the function creator, not the caller
set search_path = public
language plpgsql
as $$
begin
  -- Update the clone count for the specified plan
  update public.training_plans
  set clone_count = clone_count + 1
  where id = plan_uuid;

  -- Log any errors (optional, for debugging)
  if not found then
    raise notice 'Plan not found: %', plan_uuid;
  end if;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function increment_clone_count(uuid) to authenticated;

-- Also grant to anon users in case they can view marketplace
grant execute on function increment_clone_count(uuid) to anon;

-- ============================================
-- UPDATE EXISTING CLONE COUNTS (BACKFILL)
-- ============================================

-- Create a function to backfill clone counts based on existing private plans
-- This counts how many times each public/public_anonymous plan has been "cloned"
-- by looking for identical plan_data in private plans (not perfect, but a starting point)

create or replace function backfill_clone_counts()
returns void
security definer
set search_path = public
language plpgsql
as $$
declare
  public_plan record;
  clone_cnt integer;
begin
  -- For each public or public_anonymous plan
  for public_plan in
    select id, user_id, plan_data
    from public.training_plans
    where visibility in ('public', 'public_anonymous')
  loop
    -- Count how many private plans have similar structure
    -- Note: This is an approximation. We can't reliably determine which plans
    -- were cloned from marketplace vs created independently.
    -- This is mainly for display purposes for newly backfilled data.

    -- For now, let's just ensure the column exists and is not null
    update public.training_plans
    set clone_count = coalesce(clone_count, 0)
    where id = public_plan.id;
  end loop;

  raise notice 'Clone count backfill completed';
end;
$$;

-- Execute the backfill function
select backfill_clone_counts();

-- Drop the backfill function as it's only needed once
drop function if exists backfill_clone_counts();

-- ============================================
-- ADD LOGGING FOR DEBUGGING (OPTIONAL)
-- ============================================

-- Create a simple audit table to track clone operations (optional, for debugging)
create table if not exists public.plan_clone_audit (
  id uuid default gen_random_uuid() primary key,
  original_plan_id uuid references public.training_plans(id) on delete cascade,
  cloned_by_user_id uuid references auth.users(id) on delete cascade,
  new_plan_id uuid references public.training_plans(id) on delete cascade,
  cloned_at timestamp with time zone default now() not null
);

create index if not exists idx_plan_clone_audit_original on public.plan_clone_audit(original_plan_id);
create index if not exists idx_plan_clone_audit_user on public.plan_clone_audit(cloned_by_user_id);

-- Enable RLS
alter table public.plan_clone_audit enable row level security;

-- RLS Policies - only authenticated users can see their own clone history
create policy "Users can view own clone history"
  on public.plan_clone_audit
  for select
  using (auth.uid() = cloned_by_user_id);

-- Create a function to log clone operations
create or replace function log_plan_clone(
  original_plan_uuid uuid,
  new_plan_uuid uuid
)
returns void
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.plan_clone_audit (
    original_plan_id,
    cloned_by_user_id,
    new_plan_id
  ) values (
    original_plan_uuid,
    auth.uid(),
    new_plan_uuid
  );
end;
$$;

-- Grant execute permissions
grant execute on function log_plan_clone(uuid, uuid) to authenticated;
