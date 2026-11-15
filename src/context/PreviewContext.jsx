import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const PreviewContext = createContext(null)

// Only ONE preview exists at a time. Moving to another card swaps the title inside it.
export function PreviewProvider({ children }) {
  const [state, setState] = useState({ item: null, rect: null })
  const showTimer = useRef(null)
  const hideTimer = useRef(null)
  const currentId = useRef(null)

  const show = useCallback((item, el, { immediate = false } = {}) => {
    if (!el) return
    clearTimeout(hideTimer.current)
    if (currentId.current === item.imdbId && !immediate) return
    clearTimeout(showTimer.current)
    const delay = immediate ? 0 : currentId.current ? 180 : 650 // short delay when already open
    showTimer.current = setTimeout(() => {
      currentId.current = item.imdbId
      setState({ item, rect: el.getBoundingClientRect() })
    }, delay)
  }, [])

  const close = useCallback(() => {
    clearTimeout(showTimer.current)
    clearTimeout(hideTimer.current)
    currentId.current = null
    setState((s) => (s.item ? { item: null, rect: null } : s))
  }, [])

  const scheduleHide = useCallback(() => {
    clearTimeout(showTimer.current)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(close, 220)
  }, [close])

  const cancelHide = useCallback(() => clearTimeout(hideTimer.current), [])

  // The preview is positioned from a snapshot, so close it when the page moves
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('scroll', close, { capture: true, passive: true })
    window.addEventListener('resize', close)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', close, { capture: true })
      window.removeEventListener('resize', close)
      window.removeEventListener('keydown', onKey)
      clearTimeout(showTimer.current)
      clearTimeout(hideTimer.current)
    }
  }, [close])

  const value = useMemo(
    () => ({ state, active: Boolean(state.item), show, close, scheduleHide, cancelHide }),
    [state, show, close, scheduleHide, cancelHide]
  )
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>
}

export function usePreview() {
  const ctx = useContext(PreviewContext)
  if (!ctx) throw new Error('usePreview must be used inside PreviewProvider')
  return ctx
}
