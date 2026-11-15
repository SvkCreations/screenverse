-- Creates an empty "upcoming" list. OMDb has no release calendar, so YOU choose which unreleased titles to track.
-- To add titles: Supabase > Table Editor > curated_lists > row "upcoming" > edit imdb_ids (e.g. {tt1234567,tt7654321}).
-- The Upcoming page checks each title's release date from OMDb, so a title is never shown as "coming soon" once it is out.
insert into public.curated_lists (slug, title, imdb_ids, sort_order)
values ('upcoming', 'Upcoming', '{}', 8)
on conflict (slug) do nothing;
