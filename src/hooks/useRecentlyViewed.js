import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase.js'

// Logged-in users only. Called from the details page.
export async function recordView(userId, item) {
  if (!supabase || !userId) return
  const { error } = await supabase.from('recently_viewed').upsert(
    {
      user_id: userId,
      imdb_id: item.imdbId,
      title: item.title,
      poster: item.poster ?? null,
      viewed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,imdb_id' }
  )
  if (error) console.warn('recordView failed:', error.message)
}

export function useRecentlyViewed(userId) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(Boolean(userId))

  useEffect(() => {
    if (!supabase || !userId) {
      setItems([])
      setLoading(false)
      return
    }
    let cancelled = false
    supabase
      .from('recently_viewed')
      .select('imdb_id,title,poster')
      .order('viewed_at', { ascending: false })
      .limit(12)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.warn('recently viewed failed:', error.message)
        setItems((data || []).map((r) => ({ imdbId: r.imdb_id, title: r.title, poster: r.poster, type: null })))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  return { items, loading }
}
