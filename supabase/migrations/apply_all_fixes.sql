-- 1. Create helper security definer function to avoid infinite RLS recursion
drop function if exists public.is_conversation_participant(uuid, uuid) cascade;
create or replace function public.is_conversation_participant(p_conv_id uuid, p_user_id uuid)
returns boolean security definer as $$
begin
  return exists (
    select 1 from public.participants
    where conversation_id = p_conv_id and user_id = p_user_id
  );
end;
$$ language plpgsql;

-- 2. Drop and replace recursive policies
drop policy if exists "Allow users to view participants of their conversations" on public.participants;
create policy "Allow users to view participants of their conversations" on public.participants
  for select using (
    user_id = auth.uid() or public.is_conversation_participant(conversation_id, auth.uid())
  );

drop policy if exists "Allow users to view conversations they are part of" on public.conversations;
create policy "Allow users to view conversations they are part of" on public.conversations
  for select using (
    auth.role() = 'authenticated'
  );

drop policy if exists "Allow users to view messages in their conversations" on public.messages;
create policy "Allow users to view messages in their conversations" on public.messages
  for select using (
    public.is_conversation_participant(conversation_id, auth.uid())
  );


-- 3. Messages UPDATE and DELETE policies for Vanish Mode support
drop policy if exists "Allow users to delete their own messages" on public.messages;
drop policy if exists "Allow participants to delete messages" on public.messages;
create policy "Allow participants to delete messages" on public.messages
  for delete using (
    public.is_conversation_participant(conversation_id, auth.uid())
  );

drop policy if exists "Allow participants to update messages" on public.messages;
create policy "Allow participants to update messages" on public.messages
  for update using (
    public.is_conversation_participant(conversation_id, auth.uid())
  );


-- 4. Create game_stats table
create table if not exists public.game_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  highest_score integer default 0,
  total_games integer default 0,
  total_hearts integer default 0,
  max_combo integer default 0,
  updated_at timestamp with time zone default now()
);

-- Enable RLS on game_stats
alter table public.game_stats enable row level security;

drop policy if exists "Allow users to view their own game stats" on public.game_stats;
drop policy if exists "Allow users to insert their own game stats" on public.game_stats;
drop policy if exists "Allow users to update their own game stats" on public.game_stats;

create policy "Allow users to view their own game stats" on public.game_stats
  for select using (auth.uid() = user_id);

create policy "Allow users to insert their own game stats" on public.game_stats
  for insert with check (auth.uid() = user_id);

create policy "Allow users to update their own game stats" on public.game_stats
  for update using (auth.uid() = user_id);

-- Add database replication for realtime
-- (Commented out because game_stats is already a member of the publication)
-- alter publication supabase_realtime add table public.game_stats;


-- 5. Create storage bucket for avatars and setup its policies
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Drop existing policies if they exist (to avoid collisions)
drop policy if exists "Allow public access to avatars" on storage.objects;
drop policy if exists "Allow authenticated users to upload avatars" on storage.objects;
drop policy if exists "Allow users to update their own avatars" on storage.objects;
drop policy if exists "Allow users to delete their own avatars" on storage.objects;

-- Create policies for storage.objects
create policy "Allow public access to avatars" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Allow authenticated users to upload avatars" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Allow users to update their own avatars" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Allow users to delete their own avatars" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
