-- Create game_stats table
create table if not exists public.game_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  highest_score integer default 0,
  total_games integer default 0,
  total_hearts integer default 0,
  max_combo integer default 0,
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.game_stats enable row level security;

-- Drop existing policies if they exist (to avoid collisions)
drop policy if exists "Allow users to view their own game stats" on public.game_stats;
drop policy if exists "Allow users to insert their own game stats" on public.game_stats;
drop policy if exists "Allow users to update their own game stats" on public.game_stats;

-- Create Policies
create policy "Allow users to view their own game stats" on public.game_stats
  for select using (auth.uid() = user_id);

create policy "Allow users to insert their own game stats" on public.game_stats
  for insert with check (auth.uid() = user_id);

create policy "Allow users to update their own game stats" on public.game_stats
  for update using (auth.uid() = user_id);

-- Add database replication for realtime if needed
alter publication supabase_realtime add table public.game_stats;
