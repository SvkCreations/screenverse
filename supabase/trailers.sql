-- Trailer cache. Safe to run more than once.
-- status: 'ok' = play it, 'none' = no trusted trailer found (re-checked after 7 days), 'blocked' = never play.
-- source: 'auto' = found by the trailer-lookup function, 'manual' = added by you.
create table if not exists public.trailers (
  imdb_id text primary key,
  youtube_id text check (youtube_id is null or youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  title text,
  channel text,
  video_title text,
  status text not null default 'ok' check (status in ('ok', 'none', 'blocked')),
  source text not null default 'auto' check (source in ('auto', 'manual')),
  checked_at timestamptz not null default now()
);

alter table public.trailers enable row level security;

-- Anyone can read. Only the server (service role, used by the Edge Function) and you in the dashboard can write.
drop policy if exists "public read trailers" on public.trailers;
create policy "public read trailers" on public.trailers for select using (true);

-- To add a trailer yourself (Table Editor > trailers > Insert row):
--   imdb_id = tt0111161, youtube_id = the 11 characters after v= in the studio's official YouTube link,
--   status = ok, source = manual.
-- To remove a bad one: set status = blocked.
