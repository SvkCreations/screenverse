import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MovieCard from './MovieCard.jsx'
import { SkeletonRow } from './SkeletonLoader.jsx'
import styles from './CatalogView.module.css'

// A filterable grid of titles: type pills, genre chips, sort. Used by Movies, Series and language pages.
export default function CatalogView({ title, blurb, items, loading, error, lockedType = null, children }) {
  const [type, setType] = useState('')
  const [genre, setGenre] = useState('')
  const [sort, setSort] = useState('rating')

  const activeType = lockedType || type

  const typed = useMemo(() => items.filter((i) => !activeType || i.type === activeType), [items, activeType])

  const genres = useMemo(() => {
    const counts = {}
    typed.forEach((i) => i.genres.forEach((g) => (counts[g] = (counts[g] || 0) + 1)))
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([g]) => g)
  }, [typed])

  const visible = useMemo(() => {
    const list = typed.filter((i) => !genre || i.genres.includes(genre))
    return [...list].sort((a, b) =>
      sort === 'newest'
        ? (parseInt(b.year) || 0) - (parseInt(a.year) || 0)
        : (parseFloat(b.imdbRating) || 0) - (parseFloat(a.imdbRating) || 0)
    )
  }, [typed, genre, sort])

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <h1>{title}</h1>
        {blurb && <p>{blurb}</p>}
      </header>

      <div className={styles.controls}>
        {!lockedType && (
          <div className={styles.pills} role="group" aria-label="Type">
            {[['', 'All'], ['movie', 'Movies'], ['series', 'Series']].map(([v, l]) => (
              <button key={v} className={type === v ? styles.on : ''} onClick={() => { setType(v); setGenre('') }}>{l}</button>
            ))}
          </div>
        )}
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="rating">Top rated</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {genres.length > 1 && (
        <div className={styles.chips}>
          <button className={!genre ? styles.chipOn : ''} onClick={() => setGenre('')}>All genres</button>
          {genres.map((g) => (
            <button key={g} className={genre === g ? styles.chipOn : ''} onClick={() => setGenre(g)}>{g}</button>
          ))}
        </div>
      )}

      {loading ? (
        <SkeletonRow count={8} />
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : visible.length === 0 ? (
        <p className={styles.empty}>
          Nothing in our catalogue matches this yet. <Link to="/search">Search for any title</Link>.
        </p>
      ) : (
        <div className={styles.grid}>
          {visible.map((item) => <MovieCard key={item.imdbId} item={item} />)}
        </div>
      )}

      <p className={styles.note}>
        This page shows our curated catalogue ({items.length} titles). To find any other title, use <Link to="/search">Search</Link>.
      </p>
      {children}
    </main>
  )
}
