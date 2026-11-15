import { Link } from 'react-router-dom'
import { Bookmark } from 'lucide-react'
import MovieCard from '../components/MovieCard.jsx'
import { useWatchlist } from '../context/WatchlistContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './Watchlist.module.css'

export default function Watchlist() {
  const { items, error } = useWatchlist()
  const { user } = useAuth()

  return (
    <main className={styles.page}>
      <h1>My Watchlist</h1>
      {!user && (
        <p className={styles.note}>
          Saved on this device only. <Link to="/login">Log in</Link> to keep it in your account.
        </p>
      )}
      {error && <p className={styles.error}>{error}</p>}
      {items.length === 0 ? (
        <div className={styles.empty}>
          <Bookmark size={36} />
          <p>Your watchlist is empty. Tap the bookmark on any poster to save it.</p>
          <Link to="/">Browse titles</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((item) => <MovieCard key={item.imdbId} item={item} />)}
        </div>
      )}
    </main>
  )
}
