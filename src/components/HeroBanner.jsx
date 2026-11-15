import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, Info, Plus, Check, Star } from 'lucide-react'
import TrailerPlayer from './TrailerPlayer.jsx'
import { useWatchlist } from '../context/WatchlistContext.jsx'
import { usePreview } from '../context/PreviewContext.jsx'
import { useTrailer } from '../hooks/useTrailer.js'
import { useInView } from '../hooks/useInView.js'
import { markTrailerFailed } from '../services/trailers.js'
import { bigPoster } from '../utils/images.js'
import styles from './HeroBanner.module.css'

export default function HeroBanner({ item }) {
  const { has, toggle } = useWatchlist()
  const preview = usePreview()
  const trailer = useTrailer(item)
  const playerRef = useRef(null)
  const [heroEl, setHeroEl] = useState(null)
  const watching = useInView(heroEl)
  const [bigFailed, setBigFailed] = useState(false)
  const [, bump] = useState(0)

  const saved = has(item.imdbId)
  const img = !bigFailed ? bigPoster(item.poster) : item.poster
  const ready = trailer.status === 'ready'
  const length = item.type === 'series' && item.seasons
    ? `${item.seasons} season${item.seasons === '1' ? '' : 's'}`
    : item.runtime

  const trailerLabel = ready ? 'Watch trailer' : trailer.status === 'loading' ? 'Loading trailer…' : 'Trailer unavailable'

  return (
    <header className={styles.hero} ref={setHeroEl}>
      {img && <img className={styles.backdrop} src={img} alt="" onError={() => setBigFailed(true)} />}
      {ready && (
        <TrailerPlayer
          ref={playerRef}
          cover
          youtubeId={trailer.youtubeId}
          title={item.title}
          paused={preview.active || !watching}
          controlsClassName={styles.trailerControls}
          onFail={() => {
            markTrailerFailed(item.imdbId)
            bump((n) => n + 1)
          }}
        />
      )}
      <div className={styles.overlay} />
      <div className={styles.content}>
        <span className={styles.kicker}>Featured Tonight</span>
        <h1 className={styles.title}>{item.title}</h1>
        <div className={styles.meta}>
          {item.imdbRating && (
            <span className={styles.rating}>
              <Star size={14} fill="currentColor" /> {item.imdbRating} <small>IMDb</small>
            </span>
          )}
          {[item.year, item.genres.slice(0, 3).join(' / '), length].filter(Boolean).map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
        {item.plot && <p className={styles.plot}>{item.plot}</p>}
        <div className={styles.actions}>
          <button className={styles.primary} disabled={!ready} onClick={() => playerRef.current?.playWithSound()}>
            <Play size={18} fill="currentColor" /> {trailerLabel}
          </button>
          <Link className={styles.secondary} to={`/title/${item.imdbId}`}>
            <Info size={18} /> More details
          </Link>
          <button className={styles.secondary} onClick={() => toggle(item)}>
            {saved ? <Check size={18} /> : <Plus size={18} />} {saved ? 'In watchlist' : 'Watchlist'}
          </button>
        </div>
      </div>
    </header>
  )
}
