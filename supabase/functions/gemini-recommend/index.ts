// Supabase Edge Function: keeps the Gemini key on the server.
// The browser sends choices (mood, tastes, genres...). We build the prompt here, ask Gemini for
// structured JSON, and return it. The app then verifies every title against OMDb.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function clean(v: unknown, max = 60): string {
  return typeof v === 'string' ? v.replace(/[\r\n]+/g, ' ').trim().slice(0, max) : ''
}
function cleanList(v: unknown, maxItems = 12, max = 60): string[] {
  return Array.isArray(v) ? v.map((x) => clean(x, max)).filter(Boolean).slice(0, maxItems) : []
}

const SYSTEM = `You are the recommendation engine for SCREENVAULT, a movie and TV discovery site.
Rules:
- Recommend ONLY real movies and TV series that you are certain exist.
- Use the exact title as listed on IMDb and the correct first release year.
- Never invent titles. Never state cast, ratings, or release dates in your reasons.
- Return 10 distinct recommendations, best fit first. Mix famous and lesser-known picks.
- "reason" is 1-2 sentences on why it fits THIS request.
- "matchScore" is an honest integer 0-100 for how well it fits the request. Do not give everything 90+.
- "strategy" is 1-2 sentences describing how you interpreted the request.
- "message" is one short friendly sentence.
- Output JSON only.`

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    message: { type: 'STRING' },
    strategy: { type: 'STRING' },
    recommendations: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          year: { type: 'INTEGER' },
          type: { type: 'STRING', enum: ['movie', 'series'] },
          reason: { type: 'STRING' },
          matchScore: { type: 'INTEGER' },
        },
        required: ['title', 'year', 'type', 'reason', 'matchScore'],
      },
    },
  },
  required: ['message', 'strategy', 'recommendations'],
}

function buildPrompt(p: Record<string, unknown>): string {
  const lines: string[] = []
  const mode = p.mode === 'chat' ? 'chat' : 'guided'

  const language = ['Hindi', 'English', 'Bengali'].includes(clean(p.language)) ? clean(p.language) : ''
  const type = p.type === 'movie' || p.type === 'series' ? p.type : ''
  const exclude = cleanList(p.exclude, 30, 80)

  if (mode === 'chat') {
    const history = Array.isArray(p.history) ? p.history.slice(-6) : []
    if (history.length) {
      lines.push('Conversation so far:')
      for (const h of history as Array<Record<string, unknown>>) {
        const role = h?.role === 'assistant' ? 'Assistant' : 'User'
        lines.push(`${role}: ${clean(h?.text, 300)}`)
      }
    }
    lines.push(`User request: ${clean(p.message, 500)}`)
  } else {
    const mood = clean(p.mood)
    const tastes = cleanList(p.tastes)
    const genres = cleanList(p.genres)
    if (mood) lines.push(`Mood right now: ${mood}. Pick titles that suit this mood (a sad mood can mean cathartic or comforting).`)
    if (tastes.length) lines.push(`Storytelling taste: ${tastes.join(', ')}.`)
    if (genres.length) lines.push(`Genres: ${genres.join(', ')}.`)
  }
  if (language) lines.push(`Language: only ${language}-language titles.`)
  if (type) lines.push(`Format: only ${type === 'movie' ? 'movies' : 'TV series'}.`)
  if (exclude.length) lines.push(`Do not repeat these (already shown): ${exclude.join('; ')}.`)
  return lines.join('\n')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) return json({ error: 'GEMINI_API_KEY is not set on the server.' }, 500)

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Request body must be JSON.' }, 400)
  }

  const prompt = buildPrompt(payload)
  if (prompt.trim().length < 5) return json({ error: 'Tell me a mood, taste, genre or a request first.' }, 400)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 40000)

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: SCHEMA,
            temperature: 0.9,
            maxOutputTokens: 4096,
          },
        }),
      }
    )

    if (res.status === 429) {
      return json({ error: 'Gemini rate limit reached. Wait a minute and try again.' }, 429)
    }
    if (!res.ok) {
      let detail = `HTTP ${res.status}`
      try {
        const b = await res.json()
        if (b?.error?.message) detail = String(b.error.message).slice(0, 200)
      } catch { /* ignore */ }
      return json({ error: `Gemini error: ${detail}` }, 502)
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return json({ error: 'The AI returned no result (it may have been blocked). Try rewording.' }, 502)
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(String(text).replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''))
    } catch {
      return json({ error: 'The AI returned invalid JSON. Please try again.' }, 502)
    }
    return json(parsed)
  } catch (e) {
    const timedOut = e instanceof DOMException && e.name === 'AbortError'
    return json({ error: timedOut ? 'Gemini took too long. Try again.' : 'Could not reach Gemini.' }, 502)
  } finally {
    clearTimeout(timer)
  }
})
