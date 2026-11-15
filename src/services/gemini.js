import { invokeFn } from './functions.js'
import { findByTitle } from './omdb.js'

const MAX_SHOWN = 8

// Never trust the AI's JSON: check the shape and clean every field.
function validate(data) {
  if (!data || typeof data !== 'object') throw new Error('The AI returned an unexpected response.')
  const raw = Array.isArray(data.recommendations) ? data.recommendations : []
  const recommendations = []
  for (const r of raw) {
    if (!r || typeof r.title !== 'string' || !r.title.trim()) continue
    const year = Number.parseInt(r.year, 10)
    const score = Number(r.matchScore)
    recommendations.push({
      title: r.title.trim(),
      year: Number.isFinite(year) ? year : null,
      type: r.type === 'series' ? 'series' : 'movie',
      reason: typeof r.reason === 'string' ? r.reason.trim() : '',
      matchScore: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null,
    })
  }
  return {
    message: typeof data.message === 'string' ? data.message.trim() : '',
    strategy: typeof data.strategy === 'string' ? data.strategy.trim() : '',
    recommendations,
  }
}

// Look the title up in OMDb. Returns the real record, or null if it can't be verified.
async function verifyOne(rec, language) {
  let found = null
  if (rec.year) found = await findByTitle(rec.title, { type: rec.type, year: rec.year })
  if (!found) {
    const loose = await findByTitle(rec.title, { type: rec.type })
    const y = Number.parseInt(loose?.year, 10)
    if (loose && (!rec.year || (Number.isFinite(y) && Math.abs(y - rec.year) <= 1))) found = loose
  }
  if (!found) return null
  if (language && !found.languages.includes(language)) return null
  return { ...found, reason: rec.reason, matchScore: rec.matchScore }
}

// payload: { mode: 'guided'|'chat', mood, tastes, genres, language, type, message, history, exclude }
export async function getRecommendations(payload) {
  const raw = await invokeFn('gemini-recommend', payload)
  const { message, strategy, recommendations } = validate(raw)
  if (recommendations.length === 0) {
    throw new Error('The AI did not suggest any titles. Try different choices or wording.')
  }

  const settled = await Promise.allSettled(recommendations.map((r) => verifyOne(r, payload.language || '')))
  if (settled.every((s) => s.status === 'rejected')) throw settled[0].reason

  const seen = new Set()
  const items = []
  for (const s of settled) {
    if (s.status !== 'fulfilled' || !s.value || seen.has(s.value.imdbId)) continue
    seen.add(s.value.imdbId)
    items.push(s.value)
  }
  const shown = items.slice(0, MAX_SHOWN)
  return { message, strategy, items: shown, dropped: recommendations.length - items.length }
}
