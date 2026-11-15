import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase.js'
import { getTitle } from '../services/omdb.js'

// Loads a curated list (IMDb IDs from Supabase) and fills in details from OMDb.
export function useCuratedList(slug) {
  const [state, setState] = useState({ title: '', items: [], loading: true, error: null })

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!supabase) {
        setState({ title: '', items: [], loading: false, error: 'Supabase is not configured.' })
        return
      }
      try {
        const { data, error } = await supabase
          .from('curated_lists')
          .select('title, imdb_ids')
          .eq('slug', slug)
          .maybeSingle()
        if (error) throw new Error(error.message)
        if (!data) throw new Error(`List "${slug}" not found. Did you run seed_curated.sql?`)

        const results = await Promise.allSettled(data.imdb_ids.map((id) => getTitle(id)))
        const items = results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
        const failed = results.filter((r) => r.status === 'rejected')
        if (failed.length) console.warn(`[${slug}] ${failed.length} title(s) skipped:`, failed.map((f) => f.reason?.message))
        if (items.length === 0 && failed.length) throw new Error(failed[0].reason?.message || 'Could not load titles.')

        if (!cancelled) setState({ title: data.title, items, loading: false, error: null })
      } catch (e) {
        if (!cancelled) setState({ title: '', items: [], loading: false, error: e.message })
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [slug])

  return state
}
