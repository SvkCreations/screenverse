import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Play, Plus, Check, User, Info, Heart } from 'lucide-react'
import RatingBadge from '../components/RatingBadge.jsx'
import TrailerPlayer from '../components/TrailerPlayer.jsx'
import { useTrailer } from '../hooks/useTrailer.js'
import { useInView } from '../hooks/useInView.js'
import { markTrailerFailed } from '../services/trailers.js'
import { useWatchlist } from '../context/WatchlistContext.jsx'
import { useFavourites } from '../context/FavouritesContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { recordView } from '../hooks/useRecentlyViewed.js'
import { getTitle } from '../services/omdb.js'
import { bigPoster } from '../utils/images.js'
import styles from './TitleDetails.module.css'

function Skeleton() {
  return <div className={styles.skel} aria-label="Loading" />
}

export default function TitleDetails() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [error, setError] = useState(null)
  const [posterBroken, setPosterBroken] = useState(false)
  const { has, toggle } = useWatchlist()
  const { has: isFav, toggle: toggleFav } = useFavourites()
  const { user } = useAuth()

  useEffect(() => {
    let cancelled = false
    setItem(null)
    setError(null)
    setPosterBroken(false)
    window.scrollTo(0, 0)
    getTitle(id)
      .then((t) => !cancelled && setItem(t))
      .catch((e) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (item) document.title = `${item.title} — SCREENVAULT`
    return () => {
      document.title = 'SCREENVAULT — Your Cinema. One Destination.'
    }
  }, [item])

  const userId = user?.id
  useEffect(() => {
    if (item && userId) recordView(userId, item)
  }, [item, userId])

  const trailer = useTrailer(item)
  const playerRef = useRef(null)
  const [trailerEl, setTrailerEl] = useState(null)
  const trailerWatched = useInView(trailerEl)
  const [, bump] = useState(0)

  if (error) {
    return (
      <main className={styles.state}>
        <h2>Couldn’t load this title</h2>
        <p>{error}</p>
        <Link to="/search">← Back to search</Link>
      </main>
    )
  }
  if (!item) return <Skeleton />

  const saved = has(item.imdbId)
  const trailerReady = trailer.status === 'ready'
  function watchTrailer() {
    document.getElementById('trailer')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    playerRef.current?.playWithSound()
  }
  const otherRatings = item.ratings.filter((r) => !/internet movie database/i.test(r.source))
  const length = item.type === 'series' && item.seasons
    ? `${item.seasons} season${item.seasons === '1' ? '' : 's'}`
    : item.runtime
  const info = [
    ['Released', item.released],
    ['Language', item.languages.join(', ')],
    ['Country', item.country],
    ['Director', item.director],
    ['Writers', item.writers],
    ['Production', item.production],
    ['Awards', item.awards],
  ].filter(([, v]) => v)

  return (
    <main>
      <section className={styles.hero}>
        {item.poster && <img className={styles.backdrop} src={bigPoster(item.poster)} alt="" />}
        <div className={styles.overlay} />
        <div className={styles.inner}>
          <Link to="/" className={styles.back}><ArrowLeft size={16} /> Back</Link>
          <div className={styles.top}>
            <div className={styles.poster}>
              {item.poster && !posterBroken ? (
                <img src={item.poster} alt={`${item.title} poster`} onError={() => setPosterBroken(true)} />
              ) : (
                <div className={styles.noPoster}>{item.title}</div>
              )}
            </div>
            <div className={styles.head}>
              <span className={styles.kicker}>{item.type === 'series' ? 'TV Series' : 'Movie'}</span>
              <h1>{item.title}</h1>
              <div className={styles.meta}>
                {[item.year, length, item.genres.join(' / ')].filter(Boolean).map((m) => <span key={m}>{m}</span>)}
              </div>

              <div className={styles.ratings}>
                <RatingBadge
                  variant="imdb"
                  label="IMDb rating"
                  value={item.imdbRating ? `${item.imdbRating}/10` : null}
                  sub={item.imdbVotes ? `${item.imdbVotes} votes` : null}
                />
                {otherRatings.map((r) => (
                  <RatingBadge key={r.source} label={r.source} value={r.value} />
                ))}
              </div>
              {!item.imdbRating && <p className={styles.dim}>No IMDb rating available for this title yet.</p>}

              <div className={styles.actions}>
                <button className={styles.primary} disabled={!trailerReady} onClick={watchTrailer}>
                  <Play size={18} fill="currentColor" />{' '}
                  {trailerReady ? 'Watch trailer' : trailer.status === 'loading' ? 'Loading trailer…' : 'Trailer unavailable'}
                </button>
                <button className={styles.secondary} onClick={() => toggle(item)}>
                  {saved ? <Check size={18} /> : <Plus size={18} />} {saved ? 'In watchlist' : 'Add to watchlist'}
                </button>
                <button className={styles.secondary} onClick={() => toggleFav(item)}>
                  <Heart size={18} fill={isFav(item.imdbId) ? 'currentColor' : 'none'} /> {isFav(item.imdbId) ? 'Favourited' : 'Favourite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        {trailerReady && (
          <section id="trailer" ref={setTrailerEl}>
            <h2>Official trailer</h2>
            <div className={styles.trailer}>
              <TrailerPlayer
                ref={playerRef}
                youtubeId={trailer.youtubeId}
                poster={bigPoster(item.poster)}
                title={item.title}
                paused={!trailerWatched}
                onFail={() => {
                  markTrailerFailed(item.imdbId)
                  bump((n) => n + 1)
                }}
              />
            </div>
          </section>
        )}

        {item.plot && (
          <section>
            <h2>Synopsis</h2>
            <p className={styles.plot}>{item.plot}</p>
          </section>
        )}

        {item.actors.length > 0 && (
          <section>
            <h2>Cast</h2>
            <div className={styles.cast}>
              {item.actors.map((name) => (
                <div key={name} className={styles.actor}>
                  <div className={styles.avatar}><User size={22} /></div>
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {info.length > 0 && (
          <section>
            <h2>Details</h2>
            <dl className={styles.info}>
              {info.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className={styles.notice}>
          <Info size={18} />
          <p>
            Ratings, cast and details come from OMDb (IMDb data). OMDb doesn’t provide cast photos, user reviews or
            similar-title lists, so those sections are not shown rather than faked.
          </p>
        </section>
      </div>
    </main>
  )
}
