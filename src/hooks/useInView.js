import { useEffect, useState } from 'react'

// true while the element is on screen AND the browser tab is visible. Used to pause trailers.
export function useInView(el, threshold = 0.25) {
  const [inView, setInView] = useState(true)
  const [tabVisible, setTabVisible] = useState(() => document.visibilityState !== 'hidden')

  useEffect(() => {
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [el, threshold])

  useEffect(() => {
    const onChange = () => setTabVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  return inView && tabVisible
}
