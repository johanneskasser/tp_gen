-- ============================================
-- MARKETPLACE SCHEMA
-- ============================================

-- Enum for plan visibility
create type plan_visibility as enum ('private', 'public', 'public_anonymous');

-- Extend training_plans table with marketplace fields
alter table public.training_plans
  add column if not exists visibility plan_visibility default 'private' not null,
  add column if not exists description text,
  add column if not exists tags text[] default array[]::text[],
  add column if not exists published_at timestamp with time zone,
  add column if not exists view_count integer default 0 not null,
  add column if not exists clone_count integer default 0 not null,
  add column if not exists is_template boolean default false not null;

-- Index for marketplace queries
create index if not exists idx_training_plans_visibility on public.training_plans(visibility);
create index if not exists idx_training_plans_published_at on public.training_plans(published_at desc);
create index if not exists idx_training_plans_tags on public.training_plans using gin(tags);

-- ============================================
-- PLAN LIKES TABLE
-- ============================================
create table if not exists public.plan_likes (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.training_plans(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  unique(plan_id, user_id)
);

create index if not exists idx_plan_likes_plan_id on public.plan_likes(plan_id);
create index if not exists idx_plan_likes_user_id on public.plan_likes(user_id);

-- Enable RLS
alter table public.plan_likes enable row level security;

-- RLS Policies for plan_likes
create policy "Anyone can view likes"
  on public.plan_likes
  for select
  using (true);

create policy "Users can create own likes"
  on public.plan_likes
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own likes"
  on public.plan_likes
  for delete
  using (auth.uid() = user_id);

-- ============================================
-- PLAN RATINGS TABLE
-- ============================================
create table if not exists public.plan_ratings (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.training_plans(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(plan_id, user_id)
);

create index if not exists idx_plan_ratings_plan_id on public.plan_ratings(plan_id);
create index if not exists idx_plan_ratings_user_id on public.plan_ratings(user_id);

-- Enable RLS
alter table public.plan_ratings enable row level security;

-- RLS Policies for plan_ratings
create policy "Anyone can view ratings"
  on public.plan_ratings
  for select
  using (true);

create policy "Users can create own ratings"
  on public.plan_ratings
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own ratings"
  on public.plan_ratings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own ratings"
  on public.plan_ratings
  for delete
  using (auth.uid() = user_id);

-- Trigger to automatically update updated_at
create trigger update_plan_ratings_updated_at
  before update on public.plan_ratings
  for each row
  execute function public.update_updated_at_column();

-- ============================================
-- PLAN COMMENTS TABLE
-- ============================================
create table if not exists public.plan_comments (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.training_plans(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  comment text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index if not exists idx_plan_comments_plan_id on public.plan_comments(plan_id);
create index if not exists idx_plan_comments_user_id on public.plan_comments(user_id);
create index if not exists idx_plan_comments_created_at on public.plan_comments(created_at desc);

-- Enable RLS
alter table public.plan_comments enable row level security;

-- RLS Policies for plan_comments
create policy "Anyone can view comments"
  on public.plan_comments
  for select
  using (true);

create policy "Users can create own comments"
  on public.plan_comments
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own comments"
  on public.plan_comments
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.plan_comments
  for delete
  using (auth.uid() = user_id);

-- Trigger to automatically update updated_at
create trigger update_plan_comments_updated_at
  before update on public.plan_comments
  for each row
  execute function public.update_updated_at_column();

-- ============================================
-- UPDATE RLS POLICIES FOR PUBLIC PLANS
-- ============================================

-- Allow viewing public/published plans
create policy "Anyone can view public training plans"
  on public.training_plans
  for select
  using (visibility in ('public', 'public_anonymous') or auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get plan statistics
create or replace function get_plan_stats(plan_uuid uuid)
returns table (
  likes_count bigint,
  rating_avg numeric,
  rating_count bigint,
  comments_count bigint
) as $$
begin
  return query
  select
    (select count(*) from public.plan_likes where plan_id = plan_uuid),
    (select round(avg(rating)::numeric, 1) from public.plan_ratings where plan_id = plan_uuid),
    (select count(*) from public.plan_ratings where plan_id = plan_uuid),
    (select count(*) from public.plan_comments where plan_id = plan_uuid);
end;
$$ language plpgsql;

-- Function to increment view count
create or replace function increment_view_count(plan_uuid uuid)
returns void as $$
begin
  update public.training_plans
  set view_count = view_count + 1
  where id = plan_uuid;
end;
$$ language plpgsql;

-- Function to increment clone count
create or replace function increment_clone_count(plan_uuid uuid)
returns void as $$
begin
  update public.training_plans
  set clone_count = clone_count + 1
  where id = plan_uuid;
end;
$$ language plpgsql;

-- Function to generate automatic tags based on plan data
create or replace function generate_automatic_tags(plan_data jsonb)
returns text[] as $$
declare
  tags text[] := array[]::text[];
  distance numeric;
  duration_weeks integer;
begin
  -- Extract distance from plan
  if plan_data->'event'->>'distance' is not null then
    distance := (plan_data->'event'->>'distance')::numeric;

    -- Add distance-based tags
    if distance = 5 then
      tags := array_append(tags, '5K');
    elsif distance = 10 then
      tags := array_append(tags, '10K');
    elsif distance = 21.0975 then
      tags := array_append(tags, 'Halbmarathon');
    elsif distance = 42.195 then
      tags := array_append(tags, 'Marathon');
    elsif distance > 42.195 then
      tags := array_append(tags, 'Ultramarathon');
    else
      tags := array_append(tags, 'Custom');
    end if;
  end if;

  -- Extract weeks from plan
  if plan_data->'weeks' is not null then
    duration_weeks := jsonb_array_length(plan_data->'weeks');

    -- Add duration-based tags
    if duration_weeks <= 6 then
      tags := array_append(tags, 'Kurz (< 6 Wochen)');
    elsif duration_weeks <= 12 then
      tags := array_append(tags, 'Mittel (6-12 Wochen)');
    else
      tags := array_append(tags, 'Lang (> 12 Wochen)');
    end if;
  end if;

  -- Add terrain tags if available
  if plan_data->'event'->>'terrain' is not null then
    case plan_data->'event'->>'terrain'
      when 'road' then tags := array_append(tags, 'Straße');
      when 'trail' then tags := array_append(tags, 'Trail');
      when 'track' then tags := array_append(tags, 'Bahn');
      when 'mixed' then tags := array_append(tags, 'Mixed');
    end case;
  end if;

  return tags;
end;
$$ language plpgsql immutable;
