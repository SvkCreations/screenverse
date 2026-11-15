import { useCallback, useEffect, useMemo, useState } from 'react'
import { SearchX } from 'lucide-react'
import SearchBar from '../components/SearchBar.jsx'
import SearchFilters from '../components/SearchFilters.jsx'
import MovieCard from '../components/MovieCard.jsx'
import { SkeletonRow } from '../components/SkeletonLoader.jsx'
import { useDebounce } from '../hooks/useDebounce.js'
import { useSearchHistory } from '../hooks/useSearchHistory.js'
import { searchTitles, getTitle } from '../services/omdb.js'
import styles from './Search.module.css'

const DEFAULTS = { type: '', lang: '', genre: '', year: '', minRating: '', sort: 'relevance' }

export default function Search() {
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState(DEFAULTS)
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [details, setDetails] = useState({})
  const [detailsLoading, setDetailsLoading] = useState(false)
  const { history, add, clear } = useSearchHistory()

  const debouncedQ = useDebounce(q, 450)
  const term = debouncedQ.trim()
  const yearOk = /^\d{4}$/.test(filters.year)
  const serverYear = yearOk ? filters.year : undefined

  // Genre, language, rating and "top rated" need full details, which OMDb search results don't include.
  const needDetails = Boolean(filters.genre || filters.lang || filters.minRating || filters.sort === 'rating')

  // New search (or changed type/year): fetch page 1
  useEffect(() => {
    if (term.length < 2) {
      setResults([])
      setTotal(0)
      setError(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    setPage(1)
    searchTitles(term, { type: filters.type || undefined, year: serverYear, page: 1 })
      .then((r) => {
        if (cancelled) return
        setResults(r.results.filter((x) => x.type === 'movie' || x.type === 'series'))
        setTotal(r.total)
      })
      .catch((e) => {
        if (cancelled) return
        setResults([])
        setTotal(0)
        setError(e.message)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [term, filters.type, serverYear])

  const loadMore = useCallback(async () => {
    const next = page + 1
    setLoading(true)
    try {
      const r = await searchTitles(term, { type: filters.type || undefined, year: serverYear, page: next })
      setResults((prev) => {
        const seen = new Set(prev.map((p) => p.imdbId))
        return [...prev, ...r.results.filter((x) => !seen.has(x.imdbId) && (x.type === 'movie' || x.type === 'series'))]
      })
      setPage(next)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, term, filters.type, serverYear])

  // Fetch details for results only when a detail-based filter/sort is active
  useEffect(() => {
    if (!needDetails) return
    const missing = results.filter((r) => !details[r.imdbId])
    if (missing.length === 0) return
    let cancelled = false
    setDetailsLoading(true)
    Promise.allSettled(missing.map((r) => getTitle(r.imdbId))).then((out) => {
      if (cancelled) return
      const add = {}
      out.forEach((o) => {
        if (o.status === 'fulfilled') add[o.value.imdbId] = o.value
      })
      setDetails((prev) => ({ ...prev, ...add }))
      setDetailsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [results, needDetails, details])

  const visible = useMemo(() => {
    let list = results.map((r) => (details[r.imdbId] ? { ...r, ...details[r.imdbId] } : r))
    if (needDetails) {
      list = list.filter((r) => {
        if (!r.genres) return false // details not loaded (yet)
        if (filters.genre && !r.genres.includes(filters.genre)) return false
        if (filters.lang && !r.languages.includes(filters.lang)) return false
        if (filters.minRating && !(parseFloat(r.imdbRating) >= Number(filters.minRating))) return false
        return true
      })
    }
    if (filters.sort === 'newest') list = [...list].sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0))
    if (filters.sort === 'rating') list = [...list].sort((a, b) => (parseFloat(b.imdbRating) || 0) - (parseFloat(a.imdbRating) || 0))
    return list
  }, [results, details, needDetails, filters])

  const patch = (p) => setFilters((f) => ({ ...f, ...p }))
  const canMore = results.length < total && !loading && term.length >= 2

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Search</h1>
      <SearchBar
        value={q}
        onChange={setQ}
        onSubmit={(v) => add(v)}
        history={history}
        onPickHistory={setQ}
        onClearHistory={clear}
      />
      <SearchFilters filters={filters} onChange={patch} />
      <p className={styles.note}>
        Search is by title. OMDb can’t search by actor, director or genre; genre, language and rating filters apply to the
        titles found.
      </p>

      {term.length < 2 && !loading && (
        <p className={styles.empty}>Type at least 2 letters to search movies and series.</p>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {loading && results.length === 0 && <SkeletonRow count={6} />}

      {!loading && !error && term.length >= 2 && results.length === 0 && (
        <div className={styles.emptyBox}>
          <SearchX size={36} />
          <p>No titles found for “{term}”. Check the spelling or loosen the type and year filters.</p>
        </div>
      )}

      {results.length > 0 && (
        <>
          {needDetails && detailsLoading && <p className={styles.note}>Checking genres, languages and ratings…</p>}
          {needDetails && !detailsLoading && visible.length === 0 && (
            <div className={styles.emptyBox}>
              <SearchX size={36} />
              <p>None of the {results.length} titles loaded match those filters. Try “Load more” or relax a filter.</p>
            </div>
          )}
          <div className={styles.grid}>
            {visible.map((item) => (
              <div key={item.imdbId} onClick={() => add(term)}>
                <MovieCard item={item} />
              </div>
            ))}
          </div>
          {canMore && (
            <div className={styles.more}>
              <button onClick={loadMore}>Load more</button>
            </div>
          )}
          {loading && results.length > 0 && <p className={styles.note}>Loading…</p>}
        </>
      )}
    </main>
  )
}
