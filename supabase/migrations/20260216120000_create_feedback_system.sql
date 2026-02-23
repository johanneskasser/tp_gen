-- Migration: Create feedback system
-- Created: 2026-02-16
-- Description: Creates user_feedback table with RLS policies and rate limiting

-- Create feedback table
create table if not exists public.user_feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Rating fields (1-5 scale, nullable for low-threshold submission)
  overall_rating integer check (overall_rating >= 1 and overall_rating <= 5),
  features_rating integer check (features_rating >= 1 and features_rating <= 5),
  editor_rating integer check (editor_rating >= 1 and editor_rating <= 5),
  marketplace_rating integer check (marketplace_rating >= 1 and marketplace_rating <= 5),

  -- Text feedback fields (nullable)
  individual_feedback text,
  feature_suggestion text,

  -- Email notification metadata
  email_sent boolean default false not null,
  email_sent_at timestamp with time zone,

  -- Timestamps
  created_at timestamp with time zone default now() not null
);

-- Create indexes for performance
create index if not exists idx_user_feedback_user_id on public.user_feedback(user_id);
create index if not exists idx_user_feedback_created_at on public.user_feedback(created_at desc);
create index if not exists idx_user_feedback_email_sent on public.user_feedback(email_sent) where email_sent = false;

-- Enable Row Level Security
alter table public.user_feedback enable row level security;

-- RLS Policy: Users can view their own feedback
create policy "Users can view own feedback"
  on public.user_feedback
  for select
  using (auth.uid() = user_id);

-- RLS Policy: Users can create their own feedback
create policy "Users can create own feedback"
  on public.user_feedback
  for insert
  with check (auth.uid() = user_id);

-- RLS Policy: Users can update their own feedback
create policy "Users can update own feedback"
  on public.user_feedback
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Function: Check rate limiting (max 1 feedback per 24 hours per user)
create or replace function public.check_feedback_rate_limit(user_uuid uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  -- Return true if user CAN submit (no recent feedback)
  -- Return false if user CANNOT submit (has recent feedback)
  return not exists (
    select 1
    from public.user_feedback
    where user_id = user_uuid
    and created_at > now() - interval '24 hours'
  );
end;
$$;

-- Comment on function for documentation
comment on function public.check_feedback_rate_limit is 'Returns true if user can submit feedback (no feedback in last 24 hours), false otherwise';
