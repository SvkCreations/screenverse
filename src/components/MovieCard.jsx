import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, Play, Star } from 'lucide-react'
import { useWatchlist } from '../context/WatchlistContext.jsx'
import { usePreview } from '../context/PreviewContext.jsx'
import styles from './MovieCard.module.css'

export default function MovieCard({ item }) {
  const [broken, setBroken] = useState(false)
  const { has, toggle } = useWatchlist()
  const preview = usePreview()
  const ref = useRef(null)
  const saved = has(item.imdbId)

  function onBookmark(e) {
    e.preventDefault()
    e.stopPropagation()
    toggle(item)
  }

  // Touch screens and keyboard users: explicit preview button (hover autoplay is mouse-only)
  function onPreview(e) {
    e.preventDefault()
    e.stopPropagation()
    preview.show(item, ref.current, { immediate: true })
  }

  return (
    <Link
      ref={ref}
      to={`/title/${item.imdbId}`}
      className={styles.card}
      title={item.title}
      onPointerEnter={(e) => e.pointerType === 'mouse' && preview.show(item, ref.current)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && preview.scheduleHide()}
    >
      <div className={styles.poster}>
        {item.poster && !broken ? (
          <img src={item.poster} alt={item.title} loading="lazy" onError={() => setBroken(true)} />
        ) : (
          <div className={styles.fallback}>{item.title}</div>
        )}
        <button className={styles.preview} onClick={onPreview} aria-label={`Preview trailer for ${item.title}`}>
          <Play size={14} fill="currentColor" />
        </button>
        <button
          className={`${styles.save} ${saved ? styles.saved : ''}`}
          onClick={onBookmark}
          aria-label={saved ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>
        {item.imdbRating && (
          <span className={styles.rating}>
            <Star size={12} fill="currentColor" /> {item.imdbRating}
          </span>
        )}
      </div>
      <div className={styles.meta}>
        <span className={styles.title}>{item.title}</span>
        <span className={styles.sub}>
          {[item.year, item.type === 'series' ? 'Series' : 'Movie'].filter(Boolean).join(' · ')}
        </span>
      </div>
    </Link>
  )
}
