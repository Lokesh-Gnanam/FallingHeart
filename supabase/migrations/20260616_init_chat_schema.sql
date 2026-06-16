-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  secret_key_hash text,
  online boolean default false,
  last_seen timestamp with time zone default now(),
  push_notifications boolean default true,
  read_receipts boolean default true,
  vanish_mode boolean default false,
  dark_mode boolean default false,
  push_token text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create conversations table
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now()
);

-- Create participants table
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  is_hidden boolean default false,
  created_at timestamp with time zone default now(),
  unique (conversation_id, user_id)
);

-- Create messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  message_type text default 'text',
  is_read boolean default false,
  vanish boolean default false,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.participants enable row level security;
alter table public.messages enable row level security;

-- Profiles Policies
create policy "Allow public read access to profiles" on public.profiles
  for select using (true);

create policy "Allow users to insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Allow users to update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Conversations Policies
create policy "Allow users to view conversations they are part of" on public.conversations
  for select using (
    exists (
      select 1 from public.participants
      where conversation_id = conversations.id and user_id = auth.uid()
    )
  );

create policy "Allow authenticated users to create conversations" on public.conversations
  for insert with check (auth.role() = 'authenticated');

-- Participants Policies
create policy "Allow users to view participants of their conversations" on public.participants
  for select using (
    exists (
      select 1 from public.participants p
      where p.conversation_id = participants.conversation_id and p.user_id = auth.uid()
    )
  );

create policy "Allow authenticated users to insert participants" on public.participants
  for insert with check (auth.role() = 'authenticated');

create policy "Allow users to update their own participant settings" on public.participants
  for update using (auth.uid() = user_id);

-- Messages Policies
create policy "Allow users to view messages in their conversations" on public.messages
  for select using (
    exists (
      select 1 from public.participants
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

create policy "Allow users to insert messages in their conversations" on public.messages
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.participants
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

create policy "Allow users to delete their own messages" on public.messages
  for delete using (auth.uid() = sender_id);

-- Auto update updated_at trigger
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

-- User trigger on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, display_name, secret_key_hash, online, last_seen)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'secret_key_hash', ''),
    true,
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable Realtime
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.participants;
alter publication supabase_realtime add table public.messages;
