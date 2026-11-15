import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Search, Bookmark, Menu, X, Sparkles, User } from 'lucide-react'
import { useWatchlist } from '../context/WatchlistContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './Navbar.module.css'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/movies', label: 'Movies' },
  { to: '/series', label: 'Series' },
  { to: '/upcoming', label: 'Upcoming' },
  { to: '/language/hindi', label: 'Hindi' },
  { to: '/language/english', label: 'English' },
  { to: '/language/bengali', label: 'Bengali' },
  { to: '/ai', label: 'AI Discover', ai: true },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { items } = useWatchlist()
  const { user } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`${styles.nav} ${scrolled || open ? styles.solid : ''}`}>
      <Link to="/screenverse" className={styles.logo} onClick={() => setOpen(false)}>
        SCREEN<span>VAULT</span>
      </Link>

      <div className={`${styles.links} ${open ? styles.open : ''}`}>
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
          >
            {l.ai && <Sparkles size={14} />} {l.label}
          </NavLink>
        ))}
      </div>

      <div className={styles.icons}>
        <Link to="/search" aria-label="Search" className={styles.icon}>
          <Search size={20} />
        </Link>
        <Link to="/watchlist" aria-label="Watchlist" className={styles.icon}>
          <Bookmark size={20} />
          {items.length > 0 && <b className={styles.count}>{items.length}</b>}
        </Link>
        <Link to={user ? '/profile' : '/login'} aria-label={user ? 'Profile' : 'Log in'} className={styles.icon}>
          <User size={20} />
          {user && <b className={styles.dot} />}
        </Link>
        <button className={`${styles.icon} ${styles.burger}`} onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </nav>
  )
}
