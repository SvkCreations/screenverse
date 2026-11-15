// Supabase Edge Function: keeps the OMDb key on the server.
// Allowed params: s (search), i (IMDb id), t (title), type, y, page, plot, season

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ALLOWED = ['s', 'i', 't', 'type', 'y', 'page', 'plot', 'season']

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const apiKey = Deno.env.get('OMDB_API_KEY')
  if (!apiKey) return json({ error: 'OMDB_API_KEY is not set on the server.' }, 500)

  let params: Record<string, unknown> = {}
  try {
    params = await req.json()
  } catch {
    return json({ error: 'Request body must be JSON.' }, 400)
  }

  const url = new URL('https://www.omdbapi.com/')
  for (const k of ALLOWED) {
    const v = params[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      url.searchParams.set(k, String(v).trim())
    }
  }
  if (!url.searchParams.has('s') && !url.searchParams.has('i') && !url.searchParams.has('t')) {
    return json({ error: 'Provide s, i or t.' }, 400)
  }
  url.searchParams.set('apikey', apiKey)

  try {
    const res = await fetch(url.toString())
    if (res.status === 401) return json({ error: 'OMDb rejected the key or the daily limit was reached.' }, 429)
    if (!res.ok) return json({ error: `OMDb returned HTTP ${res.status}.` }, 502)
    const data = await res.json()
    if (data.Response === 'False' && /limit/i.test(data.Error ?? '')) {
      return json({ error: 'OMDb daily limit reached.' }, 429)
    }
    return json(data)
  } catch (e) {
    return json({ error: 'Could not reach OMDb.' }, 502)
  }
})
