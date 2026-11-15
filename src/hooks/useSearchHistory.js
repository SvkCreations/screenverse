import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'

const KEY = 'sv_search_history'

function loadLocal() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
function saveLocal(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

// Guests: in this browser. Logged in: in Supabase (search_history table).
export function useSearchHistory() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [history, setHistory] = useState(loadLocal)

  useEffect(() => {
    if (!userId || !supabase) {
      setHistory(loadLocal())
      return
    }
    let cancelled = false
    supabase
      .from('search_history')
      .select('query')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.warn('search history failed:', error.message)
          return
        }
        const seen = new Set()
        const list = []
        for (const r of data || []) {
          const k = r.query.toLowerCase()
          if (!seen.has(k)) {
            seen.add(k)
            list.push(r.query)
          }
        }
        setHistory(list.slice(0, 8))
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const add = useCallback(
    (q) => {
      const term = q.trim()
      if (term.length < 2) return
      setHistory((prev) => {
        const next = [term, ...prev.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 8)
        if (!userId) saveLocal(next)
        return next
      })
      if (userId && supabase) {
        supabase
          .from('search_history')
          .insert({ user_id: userId, query: term })
          .then(({ error }) => error && console.warn('save search failed:', error.message))
      }
    },
    [userId]
  )

  const clear = useCallback(() => {
    setHistory([])
    if (!userId) saveLocal([])
    else if (supabase) {
      supabase
        .from('search_history')
        .delete()
        .eq('user_id', userId)
        .then(({ error }) => error && console.warn('clear history failed:', error.message))
    }
  }, [userId])

  return { history, add, clear }
}
