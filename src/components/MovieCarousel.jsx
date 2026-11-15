import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MovieCard from './MovieCard.jsx'
import { SkeletonRow } from './SkeletonLoader.jsx'
import styles from './MovieCarousel.module.css'

export default function MovieCarousel({ title, items, loading, error }) {
  const track = useRef(null)

  function scroll(dir) {
    const el = track.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  // Nothing to show and no error: hide the row instead of showing an empty shell
  if (!loading && !error && items.length === 0) return null

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{title || '\u00A0'}</h2>
      {loading ? (
        <SkeletonRow />
      ) : error ? (
        <p className={styles.error}>Couldn’t load this row: {error}</p>
      ) : (
        <div className={styles.wrap}>
          <button className={`${styles.arrow} ${styles.left}`} onClick={() => scroll(-1)} aria-label="Scroll left">
            <ChevronLeft />
          </button>
          <div className={styles.track} ref={track}>
            {items.map((item) => (
              <MovieCard key={item.imdbId} item={item} />
            ))}
          </div>
          <button className={`${styles.arrow} ${styles.right}`} onClick={() => scroll(1)} aria-label="Scroll right">
            <ChevronRight />
          </button>
        </div>
      )}
    </section>
  )
}
