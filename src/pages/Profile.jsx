import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import ChipGroup from '../components/ChipGroup.jsx'
import MovieCard from '../components/MovieCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useFavourites } from '../context/FavouritesContext.jsx'
import { useRecentlyViewed } from '../hooks/useRecentlyViewed.js'
import { supabase } from '../services/supabase.js'
import { AI_GENRES, LANGUAGES } from '../utils/aiOptions.js'
import styles from './Profile.module.css'

export default function Profile() {
  const { user, signOut } = useAuth()
  const { items: favourites } = useFavourites()
  const recent = useRecentlyViewed(user.id)

  const [name, setName] = useState('')
  const [languages, setLanguages] = useState([])
  const [genres, setGenres] = useState([])
  const [status, setStatus] = useState({ loading: true, saving: false, msg: null, error: null })

  useEffect(() => {
    let cancelled = false
    supabase
      .from('profiles')
      .select('display_name,preferred_languages,preferred_genres')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setStatus((s) => ({ ...s, loading: false, error: 'Could not load your profile.' }))
        else {
          setName(data?.display_name ?? '')
          setLanguages(data?.preferred_languages ?? [])
          setGenres(data?.preferred_genres ?? [])
          setStatus((s) => ({ ...s, loading: false }))
        }
      })
    return () => {
      cancelled = true
    }
  }, [user.id])

  async function save() {
    setStatus((s) => ({ ...s, saving: true, msg: null, error: null }))
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: name.trim() || null,
      preferred_languages: languages,
      preferred_genres: genres,
    })
    setStatus((s) => ({
      ...s,
      saving: false,
      msg: error ? null : 'Saved.',
      error: error ? 'Could not save. Please try again.' : null,
    }))
  }

  async function logout() {
    try {
      await signOut()
    } catch (e) {
      setStatus((s) => ({ ...s, error: e.message }))
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1>{name || 'Your profile'}</h1>
          <p>{user.email}</p>
        </div>
        <button onClick={logout} className={styles.logout}><LogOut size={16} /> Log out</button>
      </header>

      <section className={styles.panel}>
        <h2>Preferences</h2>
        <label className={styles.field}>
          Display name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} disabled={status.loading} />
        </label>
        <ChipGroup label="Preferred languages" multi options={LANGUAGES} value={languages} onChange={setLanguages} />
        <ChipGroup label="Preferred genres" multi options={AI_GENRES} value={genres} onChange={setGenres} />
        <div className={styles.saveRow}>
          <button onClick={save} disabled={status.saving || status.loading}>{status.saving ? 'Saving…' : 'Save preferences'}</button>
          {status.msg && <span className={styles.ok}>{status.msg}</span>}
          {status.error && <span className={styles.err}>{status.error}</span>}
        </div>
        <p className={styles.hint}>Your AI Cinema choices are saved from the <Link to="/ai">AI Discover</Link> page.</p>
      </section>

      <section>
        <h2>Favourites</h2>
        {favourites.length === 0 ? (
          <p className={styles.empty}>No favourites yet. Open any title and tap “Favourite”.</p>
        ) : (
          <div className={styles.grid}>{favourites.map((i) => <MovieCard key={i.imdbId} item={i} />)}</div>
        )}
      </section>

      <section>
        <h2>Recently viewed</h2>
        {recent.loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : recent.items.length === 0 ? (
          <p className={styles.empty}>Titles you open will show up here.</p>
        ) : (
          <div className={styles.grid}>{recent.items.map((i) => <MovieCard key={i.imdbId} item={i} />)}</div>
        )}
      </section>

      <p className={styles.hint}><Link to="/watchlist">Go to my watchlist →</Link></p>
    </main>
  )
}
