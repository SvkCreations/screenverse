-- Homepage rows. OMDb has no "trending" or "top rated" lists, so we curate real IMDb IDs here.
-- Any ID that OMDb can't find is skipped by the app. Edit/add IDs anytime in Table Editor > curated_lists.
insert into public.curated_lists (slug, title, imdb_ids, sort_order) values
('featured', 'Featured Tonight',
  array['tt0816692','tt1375666','tt0468569','tt6751668','tt0482571','tt0114369','tt1130884','tt0209144'], 1),
('top-rated-movies', 'Top Rated Movies',
  array['tt0111161','tt0068646','tt0468569','tt0110912','tt0137523','tt0099685','tt0102926','tt0120737','tt0114814','tt0407887','tt0245429','tt0120689'], 2),
('acclaimed-series', 'Acclaimed Series',
  array['tt0903747','tt0306414','tt5753856','tt2356777','tt7366338','tt2085059','tt3032476','tt0944947','tt0141842','tt1475582','tt4574334','tt0795176'], 3),
('hindi-cinema', 'Hindi Cinema',
  array['tt1187043','tt0986264','tt0169102','tt5074352','tt2338151','tt0405508','tt1954470','tt0112870','tt1821480'], 4),
('hindi-series', 'Hindi Series',
  array['tt6077448','tt12392504','tt12004706','tt6998518'], 5),
('bengali-cinema', 'Bengali Cinema',
  array['tt0048473','tt0049406','tt0052572','tt0052919'], 6),
('thrillers', 'Most Popular Thrillers',
  array['tt0114369','tt0102926','tt1130884','tt0209144','tt0482571','tt0114814','tt0137523','tt1375666'], 7)
on conflict (slug) do update set title = excluded.title, imdb_ids = excluded.imdb_ids, sort_order = excluded.sort_order;
