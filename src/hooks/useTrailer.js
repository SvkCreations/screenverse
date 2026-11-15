import { useEffect, useState } from 'react'
import { getTrailer, peekTrailer } from '../services/trailers.js'

// status: idle | loading | ready | none
export function useTrailer(item, enabled = true) {
  const id = item?.imdbId
  const [fetched, setFetched] = useState({ id: null, value: undefined })

  useEffect(() => {
    if (!id || !enabled || peekTrailer(id) !== undefined) return
    let cancelled = false
    getTrailer(item).then((value) => {
      if (!cancelled) setFetched({ id, value })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, enabled])

  if (!id || !enabled) return { status: 'idle', youtubeId: null }
  const peeked = peekTrailer(id)
  const value = peeked !== undefined ? peeked : fetched.id === id ? fetched.value : undefined
  if (value === undefined) return { status: 'loading', youtubeId: null }
  return value ? { status: 'ready', youtubeId: value.youtubeId } : { status: 'none', youtubeId: null }
}
