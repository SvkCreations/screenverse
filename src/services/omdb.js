import { supabase } from './supabase.js'
import { invokeFn } from './functions.js'

// Two caches: memory (30 min) for everything, and localStorage (7 days) for title details,
// because the OMDb free tier allows only ~1000 calls a day.
const memory = new Map()
const MEM_TTL = 1000 * 60 * 30
const DISK_TTL = 1000 * 60 * 60 * 24 * 7
const DISK_PREFIX = 'sv_omdb:'

function diskGet(key) {
  try {
    const raw = localStorage.getItem(DISK_PREFIX + key)
    if (!raw) return null
    const { t, d } = JSON.parse(raw)
    if (Date.now() - t > DISK_TTL) return null
    return d
  } catch {
    return null
  }
}

function diskSet(key, data) {
  try {
    localStorage.setItem(DISK_PREFIX + key, JSON.stringify({ t: Date.now(), d: data }))
  } catch {
    // storage full or blocked: ignore, caching is only an optimisation
  }
}

async function call(params) {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check your .env file.')
  }
  const key = JSON.stringify(params)
  const isDetail = Boolean(params.i || params.t) // exact lookups are cached on disk

  const hit = memory.get(key)
  if (hit && Date.now() - hit.time < MEM_TTL) return hit.data
  if (isDetail) {
    const disk = diskGet(key)
    if (disk) {
      memory.set(key, { data: disk, time: Date.now() })
      return disk
    }
  }

  const data = await invokeFn('omdb-proxy', params)

  memory.set(key, { data, time: Date.now() })
  if (isDetail && data.Response !== 'False') diskSet(key, data)
  return data
}

const na = (v) => (v && v !== 'N/A' ? v : null)

export function normalizeTitle(d) {
  return {
    imdbId: d.imdbID,
    title: d.Title,
    year: na(d.Year),
    released: na(d.Released),
    runtime: na(d.Runtime),
    genres: na(d.Genre) ? d.Genre.split(', ') : [],
    languages: na(d.Language) ? d.Language.split(', ') : [],
    director: na(d.Director),
    writers: na(d.Writer),
    actors: na(d.Actors) ? d.Actors.split(', ') : [],
    plot: na(d.Plot),
    poster: na(d.Poster),
    imdbRating: na(d.imdbRating),
    imdbVotes: na(d.imdbVotes),
    type: d.Type,
    seasons: na(d.totalSeasons),
    country: na(d.Country),
    production: na(d.Production),
    awards: na(d.Awards),
    metascore: na(d.Metascore),
    ratings: Array.isArray(d.Ratings) ? d.Ratings.map((r) => ({ source: r.Source, value: r.Value })) : [],
  }
}

export async function searchTitles(query, { type, year, page = 1 } = {}) {
  const data = await call({ s: query, type, y: year, page })
  if (data.Response === 'False') return { results: [], total: 0 }
  return {
    results: (data.Search || []).map((r) => ({
      imdbId: r.imdbID,
      title: r.Title,
      year: r.Year,
      type: r.Type,
      poster: na(r.Poster),
    })),
    total: Number(data.totalResults) || 0,
  }
}

export async function getTitle(imdbId) {
  const data = await call({ i: imdbId, plot: 'full' })
  if (data.Response === 'False') throw new Error(data.Error || 'Title not found.')
  return normalizeTitle(data)
}

export async function findByTitle(title, { type, year } = {}) {
  const data = await call({ t: title, type, y: year })
  if (data.Response === 'False') return null
  return normalizeTitle(data)
}
