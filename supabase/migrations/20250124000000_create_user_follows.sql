-- ============================================
-- USER FOLLOWS SYSTEM
-- ============================================

-- Create user_follows table
create table if not exists public.user_follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references auth.users(id) on delete cascade not null,
  following_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  unique(follower_id, following_id),
  check (follower_id != following_id)
);

-- Create indexes for efficient queries
create index if not exists idx_user_follows_follower_id on public.user_follows(follower_id);
create index if not exists idx_user_follows_following_id on public.user_follows(following_id);
create index if not exists idx_user_follows_created_at on public.user_follows(created_at desc);

-- Enable RLS
alter table public.user_follows enable row level security;

-- RLS Policies for user_follows
create policy "Anyone can view follows"
  on public.user_follows
  for select
  using (true);

create policy "Users can follow others"
  on public.user_follows
  for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on public.user_follows
  for delete
  using (auth.uid() = follower_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get follower count for a user
create or replace function get_follower_count(user_uuid uuid)
returns bigint as $$
begin
  return (select count(*) from public.user_follows where following_id = user_uuid);
end;
$$ language plpgsql;

-- Function to get following count for a user
create or replace function get_following_count(user_uuid uuid)
returns bigint as $$
begin
  return (select count(*) from public.user_follows where follower_id = user_uuid);
end;
$$ language plpgsql;

-- Function to check if user A follows user B
create or replace function is_following(follower_uuid uuid, following_uuid uuid)
returns boolean as $$
begin
  return exists(
    select 1 from public.user_follows
    where follower_id = follower_uuid and following_id = following_uuid
  );
end;
$$ language plpgsql;

-- Function to get plans from followed users
create or replace function get_plans_from_following(user_uuid uuid)
returns table (
  plan_id uuid,
  plan_name text,
  user_id uuid,
  visibility plan_visibility,
  published_at timestamp with time zone,
  view_count integer,
  clone_count integer
) as $$
begin
  return query
  select
    tp.id,
    tp.name,
    tp.user_id,
    tp.visibility,
    tp.published_at,
    tp.view_count,
    tp.clone_count
  from public.training_plans tp
  inner join public.user_follows uf on uf.following_id = tp.user_id
  where uf.follower_id = user_uuid
    and tp.visibility in ('public', 'public_anonymous')
  order by tp.published_at desc;
end;
$$ language plpgsql;

-- Add follower/following counts to user_profiles
alter table public.user_profiles
  add column if not exists follower_count integer default 0 not null,
  add column if not exists following_count integer default 0 not null;

-- Function to update follower/following counts
create or replace function update_follow_counts()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    -- Increment following count for follower
    update public.user_profiles
    set following_count = following_count + 1
    where id = NEW.follower_id;

    -- Increment follower count for following
    update public.user_profiles
    set follower_count = follower_count + 1
    where id = NEW.following_id;

    return NEW;
  elsif TG_OP = 'DELETE' then
    -- Decrement following count for follower
    update public.user_profiles
    set following_count = following_count - 1
    where id = OLD.follower_id;

    -- Decrement follower count for following
    update public.user_profiles
    set follower_count = follower_count - 1
    where id = OLD.following_id;

    return OLD;
  end if;
end;
$$ language plpgsql;

-- Trigger to update counts on follow/unfollow
create trigger update_follow_counts_trigger
  after insert or delete on public.user_follows
  for each row
  execute function update_follow_counts();
