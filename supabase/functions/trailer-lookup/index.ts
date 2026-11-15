// Supabase Edge Function: finds ONE official trailer for a title, verifies it, and caches it in the
// `trailers` table. The YouTube key stays on the server. The browser only calls this when the table
// has no answer yet. A YouTube search costs 100 quota units (free quota: 10,000 per day).
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

const RETRY_AFTER_MS = 7 * 24 * 3600 * 1000

// ---- text helpers -------------------------------------------------------------------------
const norm = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
const tokens = (s: string) => norm(s).split(' ').filter(Boolean)

// Channels we trust: studios, distributors and streaming platforms. Extend with the
// TRAILER_CHANNEL_ALLOWLIST secret (comma separated names).
const TRUSTED_CHANNELS = [
  'warner bros', 'warner bros pictures', 'universal pictures', 'universal studios', 'sony pictures',
  'sony pictures entertainment', 'sony pictures india', 'columbia pictures', 'paramount pictures', 'paramount plus',
  '20th century studios', '20th century fox', 'searchlight pictures', 'walt disney studios', 'disney plus',
  'marvel entertainment', 'lucasfilm', 'pixar', 'netflix', 'netflix india', 'hbo', 'prime video',
  'prime video india', 'amazon mgm studios', 'apple tv', 'lionsgate', 'lionsgate movies', 'a24', 'focus features',
  'mgm', 'united artists', 'miramax', 'bbc', 'hulu', 'showtime', 'disney hotstar', 'jiohotstar', 'jiocinema',
  'jio studios', 'sony liv', 'sonyliv', 'zee5', 'zee studios', 'yash raj films', 't series', 'dharma productions',
  'red chillies entertainment', 'excel entertainment', 'eros now', 'eros international', 'pen movies',
  'viacom18 studios', 'reliance entertainment', 'tips official', 'svf', 'hoichoi', 'eskay movies',
  'surinder films', 'shree venkatesh films', 'toho', 'studiocanal', 'pathe',
]
const extra = (Deno.env.get('TRAILER_CHANNEL_ALLOWLIST') ?? '').split(',').map(norm).filter(Boolean)
const TRUSTED = [...TRUSTED_CHANNELS.map(norm), ...extra]

function channelTrusted(channel: string): boolean {
  const c = norm(channel)
  return TRUSTED.some((t) => c === t || c.startsWith(t + ' ') || c.endsWith(' ' + t) || c.includes(' ' + t + ' '))
}

const GENERIC = new Set([
  'pictures', 'studios', 'entertainment', 'productions', 'films', 'film', 'company', 'group', 'media',
  'international', 'distribution', 'pvt', 'ltd', 'limited', 'the', 'and',
])
function productionMatches(channel: string, production: string | null): boolean {
  if (!production) return false
  const toks = tokens(production).filter((t) => t.length >= 4 && !GENERIC.has(t)).slice(0, 2)
  const c = norm(channel)
  return toks.length > 0 && toks.every((t) => c.includes(t))
}

// Words that mean "not an official trailer" (fan edits, clips, songs, reviews...)
const REJECT =
  /\b(fan|fanmade|fan made|reaction|reacts|review|parody|breakdown|explained|explanation|recap|analysis|spoof|concept|tribute|mashup|what if|ranking|top \d+|scene|clip|behind the scenes|making of|interview|full movie|full episode|song|music video|lyrical|audio|ost|soundtrack|re edit|redub|remake|alternate|ending|theory|easter eggs?|vs)\b/

const FILLER = new Set([
  'official', 'final', 'new', 'main', 'teaser', 'theatrical', 'hd', '4k', 'uhd', 'imax', 'tv', 'season', 'series',
  'movie', 'film', 'the', 'part', 'in', 'select', 'theaters', 'theatres', 'cinemas', 'now', 'only', 'coming',
  'soon', 'trailer', 'hindi', 'english', 'bengali', 'bangla',
])

function fillerAt(t: string[], i: number): boolean {
  const w = t[i], prev = t[i - 1]
  if (FILLER.has(w)) return true
  if (/^s\d{1,2}$/.test(w)) return true
  if (/^(19|20)\d{2}$/.test(w)) return true // a year, checked separately
  if (/^\d{1,2}$/.test(w) && prev && ['season', 'series', 'trailer', 'part'].includes(prev)) return true
  return false
}

// "<title> ... trailer" or "trailer ... <title>", with only harmless words in between.
function looksLikeTrailerFor(videoTitle: string, movieTitle: string): boolean {
  const v = tokens(videoTitle), m = tokens(movieTitle)
  if (!m.length) return false
  let at = -1
  for (let i = 0; i <= v.length - m.length; i++) {
    if (m.every((w, j) => v[i + j] === w)) { at = i; break }
  }
  if (at < 0) return false
  const before = v.slice(0, at)
  const after = v.slice(at + m.length)
  const tAfter = after.indexOf('trailer')
  if (tAfter >= 0) {
    return before.every((_, i) => fillerAt(before, i)) && after.slice(0, tAfter).every((_, i) => fillerAt(after, i))
  }
  if (before.includes('trailer')) return before.every((_, i) => fillerAt(before, i))
  return false
}

function yearsConflict(videoTitle: string, year: number | null): boolean {
  if (!year) return false
  const found = tokens(videoTitle).filter((w) => /^(19|20)\d{2}$/.test(w)).map(Number)
  return found.some((y) => Math.abs(y - year) > 1)
}

function seconds(iso: string): number {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '')
  if (!m) return 0
  return Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0)
}

// ---- main ---------------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Request body must be JSON.' }, 400)
  }

  const imdbId = String(body.imdbId ?? '')
  const title = String(body.title ?? '').trim().slice(0, 150)
  const year = Number.parseInt(String(body.year ?? ''), 10) || null
  const production = typeof body.production === 'string' && body.production ? body.production.slice(0, 100) : null
  if (!/^tt\d{6,10}$/.test(imdbId) || !title) return json({ error: 'imdbId and title are required.' }, 400)

  // 1. Cache
  const { data: row } = await admin.from('trailers').select('*').eq('imdb_id', imdbId).maybeSingle()
  if (row) {
    if (row.status === 'ok' && row.youtube_id) return json({ status: 'ok', youtubeId: row.youtube_id })
    if (row.status === 'blocked') return json({ status: 'none' })
    if (row.status === 'none' && Date.now() - new Date(row.checked_at).getTime() < RETRY_AFTER_MS) {
      return json({ status: 'none' })
    }
  }

  // 2. YouTube
  const key = Deno.env.get('YOUTUBE_API_KEY')
  if (!key) return json({ status: 'none', reason: 'YOUTUBE_API_KEY is not set on the server.' })

  try {
    const q = `${title} ${year ?? ''} official trailer`.trim()
    const searchUrl =
      'https://www.googleapis.com/youtube/v3/search?' +
      new URLSearchParams({
        part: 'snippet', type: 'video', videoEmbeddable: 'true', videoSyndicated: 'true',
        maxResults: '10', q, key,
      })
    const sres = await fetch(searchUrl, { signal: AbortSignal.timeout(15000) })
    if (!sres.ok) {
      const reason = (await sres.json().catch(() => null))?.error?.errors?.[0]?.reason
      // Quota or key problems: answer "none" but do NOT cache it
      return json({ status: 'none', reason: reason || `YouTube HTTP ${sres.status}` })
    }
    const search = await sres.json()
    const ids: string[] = (search.items ?? []).map((i: any) => i?.id?.videoId).filter(Boolean)

    let best: { id: string; score: number; channel: string; videoTitle: string } | null = null

    if (ids.length) {
      const vres = await fetch(
        'https://www.googleapis.com/youtube/v3/videos?' +
          new URLSearchParams({ part: 'snippet,contentDetails,status,statistics', id: ids.join(','), key }),
        { signal: AbortSignal.timeout(15000) }
      )
      if (vres.ok) {
        const videos = (await vres.json()).items ?? []
        for (const v of videos) {
          const vt: string = v.snippet?.title ?? ''
          const ch: string = v.snippet?.channelTitle ?? ''
          const dur = seconds(v.contentDetails?.duration ?? '')
          if (v.status?.embeddable !== true || v.status?.privacyStatus !== 'public') continue
          if (v.snippet?.liveBroadcastContent && v.snippet.liveBroadcastContent !== 'none') continue
          if (dur < 30 || dur > 360) continue
          if (REJECT.test(norm(vt)) || /\b(fan|reaction|edits?|tribute|review|rewind)\b/.test(norm(ch))) continue
          if (!looksLikeTrailerFor(vt, title)) continue
          if (yearsConflict(vt, year)) continue
          const trusted = channelTrusted(ch) || productionMatches(ch, production)
          if (!trusted) continue

          const t = tokens(vt)
          let score = 10
          if (t.includes('official')) score += 3
          if (year && t.includes(String(year))) score += 2
          if (productionMatches(ch, production)) score += 2
          score += Math.log10(Number(v.statistics?.viewCount ?? 0) + 1) / 2
          if (!best || score > best.score) best = { id: v.id, score, channel: ch, videoTitle: vt }
        }
      }
    }

    if (best) {
      await admin.from('trailers').upsert({
        imdb_id: imdbId, youtube_id: best.id, title, channel: best.channel, video_title: best.videoTitle,
        status: 'ok', source: 'auto', checked_at: new Date().toISOString(),
      })
      return json({ status: 'ok', youtubeId: best.id })
    }

    await admin.from('trailers').upsert({
      imdb_id: imdbId, youtube_id: null, title, status: 'none', source: 'auto', checked_at: new Date().toISOString(),
    })
    return json({ status: 'none' })
  } catch (e) {
    console.error('trailer-lookup failed:', e)
    return json({ status: 'none', reason: 'lookup_failed' })
  }
})
