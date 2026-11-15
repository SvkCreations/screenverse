import { supabase } from './supabase.js'
import { invokeFn } from './functions.js'

// imdbId -> Promise (lookups in flight / done) and imdbId -> result (for instant, synchronous reads)
const promises = new Map()
const resolved = new Map() // value: { youtubeId } | null

// undefined = not looked up yet, null = no trailer, { youtubeId } = trailer found
export function peekTrailer(imdbId) {
  return resolved.get(imdbId)
}

async function lookup(item) {
  // 1. Our own verified table first (free, instant)
  if (supabase) {
    const { data, error } = await supabase
      .from('trailers')
      .select('youtube_id,status')
      .eq('imdb_id', item.imdbId)
      .maybeSingle()
    if (!error && data) {
      if (data.status === 'ok' && data.youtube_id) return { youtubeId: data.youtube_id }
      if (data.status === 'blocked') return null
    }
  } else {
    return null
  }

  // 2. Ask the server to find + verify one (it caches the result in the table)
  try {
    const r = await invokeFn('trailer-lookup', {
      imdbId: item.imdbId,
      title: item.title,
      year: item.year,
      production: item.production || null,
    })
    return r.status === 'ok' && r.youtubeId ? { youtubeId: r.youtubeId } : null
  } catch (e) {
    console.warn('Trailer lookup failed:', e.message)
    return null
  }
}

export function getTrailer(item) {
  if (!item?.imdbId || !item.title) return Promise.resolve(null)
  const id = item.imdbId
  if (promises.has(id)) return promises.get(id)
  const p = lookup(item).then((v) => {
    resolved.set(id, v)
    return v
  })
  promises.set(id, p)
  return p
}

// The player reported an error (removed, private, embedding blocked...): stop trying this session.
export function markTrailerFailed(imdbId) {
  resolved.set(imdbId, null)
  promises.set(imdbId, Promise.resolve(null))
}
