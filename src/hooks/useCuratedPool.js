import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase.js'
import { getTitle } from '../services/omdb.js'

// Loads several curated lists at once and returns the unique titles with full OMDb details.
export function useCuratedPool(slugs) {
  const key = slugs.join(',')
  const [state, setState] = useState({ items: [], loading: true, error: null })

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!supabase) {
        setState({ items: [], loading: false, error: 'Supabase is not configured.' })
        return
      }
      setState((s) => ({ ...s, loading: true, error: null }))
      try {
        const { data, error } = await supabase.from('curated_lists').select('slug,imdb_ids').in('slug', key.split(','))
        if (error) throw new Error(error.message)

        const ids = [...new Set((data || []).flatMap((r) => r.imdb_ids))]
        const results = await Promise.allSettled(ids.map((id) => getTitle(id)))
        const items = results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
        if (ids.length > 0 && items.length === 0) throw new Error(results[0].reason?.message || 'Could not load titles.')

        if (!cancelled) setState({ items, loading: false, error: null })
      } catch (e) {
        if (!cancelled) setState({ items: [], loading: false, error: e.message })
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [key])

  return state
}
