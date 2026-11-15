import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Info, Plus, Check, Star, X } from 'lucide-react'
import TrailerPlayer from './TrailerPlayer.jsx'
import { usePreview } from '../context/PreviewContext.jsx'
import { useWatchlist } from '../context/WatchlistContext.jsx'
import { useTrailer } from '../hooks/useTrailer.js'
import { markTrailerFailed } from '../services/trailers.js'
import { bigPoster } from '../utils/images.js'
import styles from './PreviewPopover.module.css'

function Body({ item, rect, onEnter, onLeave, onClose }) {
  const trailer = useTrailer(item)
  const { has, toggle } = useWatchlist()
  const [, bump] = useState(0)
  const saved = has(item.imdbId)

  const vw = window.innerWidth
  const vh = window.innerHeight
  const width = Math.min(360, vw - 24)
  const height = (width * 9) / 16 + 170
  const style =
    vw <= 700
      ? undefined // phones: CSS turns it into a bottom sheet
      : {
          width,
          left: Math.max(12, Math.min(rect.left + rect.width / 2 - width / 2, vw - width - 12)),
          top: Math.max(76, Math.min(rect.top + rect.height / 2 - height / 2, vh - height - 12)),
        }

  const meta = [item.year, item.type === 'series' ? 'Series' : item.type === 'movie' ? 'Movie' : null, item.genres?.slice(0, 2).join(' / ')]
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      <div className={styles.scrim} onClick={onClose} />
      <div
        className={styles.pop}
        style={style}
        role="dialog"
        aria-label={`Preview of ${item.title}`}
        onPointerEnter={onEnter}
        onPointerLeave={(e) => e.pointerType === 'mouse' && onLeave()}
      >
        <div className={styles.stage}>
          {trailer.status === 'ready' ? (
            <TrailerPlayer
              youtubeId={trailer.youtubeId}
              poster={bigPoster(item.poster)}
              title={item.title}
              onFail={() => {
                markTrailerFailed(item.imdbId)
                bump((n) => n + 1)
              }}
            />
          ) : (
            <>
              {item.poster && <img className={styles.fallbackImg} src={bigPoster(item.poster)} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />}
              <span className={styles.label}>
                {trailer.status === 'loading' ? 'Loading trailer…' : 'Trailer unavailable'}
              </span>
            </>
          )}
          <button className={styles.close} onClick={onClose} aria-label="Close preview"><X size={16} /></button>
        </div>

        <div className={styles.info}>
          <h3>{item.title}</h3>
          <p className={styles.meta}>
            {item.imdbRating && (
              <span className={styles.rating}><Star size={12} fill="currentColor" /> {item.imdbRating}</span>
            )}
            {meta}
          </p>
          {item.plot && <p className={styles.plot}>{item.plot}</p>}
          <div className={styles.actions}>
            <Link to={`/title/${item.imdbId}`} className={styles.primary}><Info size={16} /> Details</Link>
            <button className={styles.secondary} onClick={() => toggle(item)} aria-pressed={saved}>
              {saved ? <Check size={16} /> : <Plus size={16} />} {saved ? 'Saved' : 'Watchlist'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function PreviewPopover() {
  const { state, cancelHide, scheduleHide, close } = usePreview()
  const location = useLocation()

  useEffect(() => {
    close()
  }, [location.pathname, close])

  if (!state.item) return null
  return <Body item={state.item} rect={state.rect} onEnter={cancelHide} onLeave={scheduleHide} onClose={close} />
}
