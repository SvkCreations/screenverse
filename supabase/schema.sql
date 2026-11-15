-- SCREENVAULT schema. Paste into Supabase > SQL Editor > New query > Run.

-- 1. Profiles (one per user, created automatically on sign-up)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_languages text[] not null default '{}',
  preferred_genres text[] not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Watchlist
create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  imdb_id text not null,
  title text not null,
  poster text,
  media_type text,
  created_at timestamptz not null default now(),
  unique (user_id, imdb_id)
);

-- 3. Favourites
create table if not exists public.favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  imdb_id text not null,
  title text not null,
  poster text,
  media_type text,
  created_at timestamptz not null default now(),
  unique (user_id, imdb_id)
);

-- 4. Recently viewed
create table if not exists public.recently_viewed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  imdb_id text not null,
  title text not null,
  poster text,
  viewed_at timestamptz not null default now(),
  unique (user_id, imdb_id)
);

-- 5. Search history
create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  created_at timestamptz not null default now()
);

-- 6. Saved AI recommendation preferences
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ai_prefs jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 7. Curated lists (real IMDb IDs that power the homepage rows; OMDb has no "trending")
create table if not exists public.curated_lists (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  imdb_ids text[] not null default '{}',
  sort_order int not null default 0
);

-- Row Level Security: users only touch their own rows
alter table public.profiles enable row level security;
alter table public.watchlist enable row level security;
alter table public.favourites enable row level security;
alter table public.recently_viewed enable row level security;
alter table public.search_history enable row level security;
alter table public.user_preferences enable row level security;
alter table public.curated_lists enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own watchlist" on public.watchlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own favourites" on public.favourites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own recently viewed" on public.recently_viewed
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own search history" on public.search_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own preferences" on public.user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Curated lists: anyone can read; only you (via dashboard) can edit
create policy "public read curated lists" on public.curated_lists
  for select using (true);
