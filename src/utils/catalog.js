// Every curated list that feeds the catalogue pages (see supabase/seed_curated.sql).
export const ALL_SLUGS = [
  'featured',
  'top-rated-movies',
  'acclaimed-series',
  'hindi-cinema',
  'hindi-series',
  'bengali-cinema',
  'thrillers',
]

export const LANGUAGE_PAGES = {
  hindi: 'Hindi',
  english: 'English',
  bengali: 'Bengali',
}

const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }

// OMDb "Released" looks like "14 Oct 2026". Returns a UTC timestamp, or null if missing/unparseable.
export function parseReleased(str) {
  const m = /^(\d{1,2}) (\w{3}) (\d{4})$/.exec(str || '')
  if (!m || MONTHS[m[2]] === undefined) return null
  return Date.UTC(Number(m[3]), MONTHS[m[2]], Number(m[1]))
}

export function todayUTC() {
  const n = new Date()
  return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())
}
