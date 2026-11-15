import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../services/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'

function loadLocal(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
function saveLocal(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list))
  } catch {
    // ignore
  }
}
const slim = (i) => ({ imdbId: i.imdbId, title: i.title, poster: i.poster ?? null, type: i.type ?? null })
const fromRow = (r) => ({ imdbId: r.imdb_id, title: r.title, poster: r.poster, type: r.media_type })
const toRow = (userId, i) => ({
  user_id: userId,
  imdb_id: i.imdbId,
  title: i.title,
  poster: i.poster ?? null,
  media_type: i.type ?? null,
})

// Guests: saved in this browser. Logged in: saved in Supabase (guest items are merged in on login).
export function useSyncedList(table, localKey) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [items, setItems] = useState(() => loadLocal(localKey))
  const [error, setError] = useState(null)
  const ref = useRef(items)
  ref.current = items

  useEffect(() => {
    let cancelled = false
    if (!userId) {
      setItems(loadLocal(localKey))
      return
    }
    if (!supabase) return

    ;(async () => {
      try {
        const guest = loadLocal(localKey)
        if (guest.length) {
          const { error: upErr } = await supabase
            .from(table)
            .upsert(guest.map((g) => toRow(userId, g)), { onConflict: 'user_id,imdb_id' })
          if (upErr) throw upErr
          saveLocal(localKey, [])
        }
        const { data, error: selErr } = await supabase
          .from(table)
          .select('imdb_id,title,poster,media_type')
          .order('created_at', { ascending: false })
        if (selErr) throw selErr
        if (!cancelled) {
          setItems(data.map(fromRow))
          setError(null)
        }
      } catch (e) {
        console.warn(`[${table}] load failed:`, e.message)
        if (!cancelled) setError('Could not load your saved titles.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, table, localKey])

  const has = useCallback((id) => items.some((i) => i.imdbId === id), [items])

  const toggle = useCallback(
    async (item) => {
      const before = ref.current
      const exists = before.some((i) => i.imdbId === item.imdbId)
      const next = exists ? before.filter((i) => i.imdbId !== item.imdbId) : [slim(item), ...before]
      ref.current = next
      setItems(next)
      setError(null)

      if (!userId) {
        saveLocal(localKey, next)
        return
      }
      try {
        const q = exists
          ? supabase.from(table).delete().eq('imdb_id', item.imdbId)
          : supabase.from(table).upsert(toRow(userId, item), { onConflict: 'user_id,imdb_id' })
        const { error: opErr } = await q
        if (opErr) throw opErr
      } catch (e) {
        console.warn(`[${table}] save failed:`, e.message)
        ref.current = before
        setItems(before) // undo
        setError('Could not save that change. Check your connection and try again.')
      }
    },
    [userId, table, localKey]
  )

  return useMemo(() => ({ items, has, toggle, error }), [items, has, toggle, error])
}
