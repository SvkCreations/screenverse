import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import MovieCard from '../components/MovieCard.jsx'
import { SkeletonRow } from '../components/SkeletonLoader.jsx'
import { useCuratedPool } from '../hooks/useCuratedPool.js'
import { parseReleased, todayUTC } from '../utils/catalog.js'
import styles from './Upcoming.module.css'

const DAY = 86400000
const SLUGS = ['upcoming']

function Group({ title, items }) {
  if (items.length === 0) return null
  return (
    <section className={styles.group}>
      <h2>{title}</h2>
      <div className={styles.grid}>
        {items.map((item) => (
          <div key={item.imdbId}>
            <MovieCard item={item} />
            {item.released && <p className={styles.date}>{item.released}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Upcoming() {
  const { items, loading, error } = useCuratedPool(SLUGS)

  const groups = useMemo(() => {
    const today = todayUTC()
    const g = { coming: [], releasing: [], recent: [], noDate: 0, older: 0 }
    for (const item of items) {
      const t = parseReleased(item.released)
      if (t === null) { g.noDate += 1; continue }
      if (t > today) g.coming.push({ item, t })
      else if (item.type === 'series' && /[–-]\s*$/.test(item.year || '')) g.releasing.push({ item, t })
      else if (today - t <= 90 * DAY) g.recent.push({ item, t })
      else g.older += 1
    }
    return {
      coming: g.coming.sort((a, b) => a.t - b.t).map((x) => x.item),
      releasing: g.releasing.sort((a, b) => b.t - a.t).map((x) => x.item),
      recent: g.recent.sort((a, b) => b.t - a.t).map((x) => x.item),
      noDate: g.noDate,
      older: g.older,
    }
  }, [items])

  const shown = groups.coming.length + groups.releasing.length + groups.recent.length

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <h1>Upcoming</h1>
        <p>Movies and series by release status. A title only appears under Coming Soon while its release date is still in the future.</p>
      </header>

      {loading ? (
        <SkeletonRow count={6} />
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <>
          <Group title="Coming Soon" items={groups.coming} />
          <Group title="Currently Releasing" items={groups.releasing} />
          <Group title="Recently Released" items={groups.recent} />

          {shown === 0 && (
            <div className={styles.empty}>
              <h2>Nothing to show yet</h2>
              <p>
                OMDb has no release calendar, so SCREENVAULT can only track the titles you add. Add IMDb IDs to the
                <b> upcoming </b> row of the <code>curated_lists</code> table in Supabase (see <code>supabase/seed_upcoming.sql</code>).
              </p>
            </div>
          )}

          {(groups.noDate > 0 || groups.older > 0) && (
            <p className={styles.note}>
              {groups.noDate > 0 && `${groups.noDate} tracked title${groups.noDate === 1 ? ' has' : 's have'} no release date in OMDb and ${groups.noDate === 1 ? 'is' : 'are'} hidden. `}
              {groups.older > 0 && `${groups.older} title${groups.older === 1 ? ' has' : 's have'} been out for over 90 days and ${groups.older === 1 ? 'was' : 'were'} moved off this page. `}
              Find them via <Link to="/search">Search</Link>.
            </p>
          )}
        </>
      )}
    </main>
  )
}
