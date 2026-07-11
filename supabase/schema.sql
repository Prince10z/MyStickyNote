-- MyStickyNote cloud sync schema.
-- Apply this in your Supabase project's SQL editor (or via `supabase db push`).

create extension if not exists "uuid-ossp";

-- One row per user, auto-created on signup. Tracks plan/AI-credit state so a
-- future hosted-AI tier (see supabase/functions/ai-proxy) can gate on it
-- without needing a separate billing table yet.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_pro boolean not null default false,
  ai_credits_remaining integer not null default 20,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Notes table. `client_note_id` is the id generated locally by the Electron
-- app (e.g. "note-1720000000000") - the sync module upserts on
-- (user_id, client_note_id) using last-write-wins based on `updated_at`.
create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_note_id text not null,
  note_text text default '',
  tags text[] not null default '{}',
  color text,
  visual_style text,
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  unique (user_id, client_note_id)
);

alter table public.notes enable row level security;

create policy "Users can manage their own notes"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists notes_user_id_idx on public.notes (user_id);
