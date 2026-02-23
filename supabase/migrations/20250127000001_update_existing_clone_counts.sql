-- ============================================
-- UPDATE EXISTING CLONE COUNTS FROM AUDIT LOG
-- ============================================

-- This migration updates the clone_count for all plans based on
-- the newly created audit log table. This should be run after
-- the initial fix_clone_count migration.

-- Create a function to recalculate all clone counts from the audit log
create or replace function recalculate_clone_counts()
returns void
security definer
set search_path = public
language plpgsql
as $$
declare
  plan_record record;
  actual_clone_count integer;
begin
  -- For each plan that exists in the audit log as an original plan
  for plan_record in
    select distinct original_plan_id
    from public.plan_clone_audit
    where original_plan_id is not null
  loop
    -- Count how many times this plan was cloned
    select count(*)
    into actual_clone_count
    from public.plan_clone_audit
    where original_plan_id = plan_record.original_plan_id;

    -- Update the clone_count in the training_plans table
    update public.training_plans
    set clone_count = actual_clone_count
    where id = plan_record.original_plan_id;

    raise notice 'Updated plan % with clone count: %', plan_record.original_plan_id, actual_clone_count;
  end loop;

  -- Ensure all other plans have clone_count set to 0 if it's null
  update public.training_plans
  set clone_count = 0
  where clone_count is null;

  raise notice 'Clone count recalculation completed';
end;
$$;

-- Execute the recalculation
-- Note: This should be run manually if you want to update existing data
-- Uncomment the line below to run it automatically:
-- select recalculate_clone_counts();

-- Grant execute permission for future use
grant execute on function recalculate_clone_counts() to authenticated;

-- ============================================
-- CREATE VIEW FOR CLONE STATISTICS
-- ============================================

-- Create a view to easily see clone statistics per plan
create or replace view plan_clone_stats as
select
  tp.id as plan_id,
  tp.name as plan_name,
  tp.user_id as creator_id,
  tp.visibility,
  tp.clone_count,
  count(pca.id) as audit_clone_count,
  array_agg(pca.cloned_by_user_id) filter (where pca.cloned_by_user_id is not null) as cloned_by_users,
  array_agg(pca.cloned_at) filter (where pca.cloned_at is not null) as clone_timestamps
from public.training_plans tp
left join public.plan_clone_audit pca on tp.id = pca.original_plan_id
where tp.visibility in ('public', 'public_anonymous')
group by tp.id, tp.name, tp.user_id, tp.visibility, tp.clone_count
order by tp.clone_count desc;

-- Grant access to the view
grant select on plan_clone_stats to authenticated;
grant select on plan_clone_stats to anon;

-- ============================================
-- OPTIONAL: MANUAL CORRECTION FUNCTION
-- ============================================

-- Function to manually correct a plan's clone count if needed
create or replace function set_clone_count(
  plan_uuid uuid,
  new_count integer
)
returns void
security definer
set search_path = public
language plpgsql
as $$
begin
  -- Validate inputs
  if new_count < 0 then
    raise exception 'Clone count cannot be negative';
  end if;

  -- Update the clone count
  update public.training_plans
  set clone_count = new_count
  where id = plan_uuid;

  if not found then
    raise exception 'Plan not found: %', plan_uuid;
  end if;

  raise notice 'Updated clone count for plan % to %', plan_uuid, new_count;
end;
$$;

-- Grant execute permission to authenticated users (admin only ideally)
grant execute on function set_clone_count(uuid, integer) to authenticated;
