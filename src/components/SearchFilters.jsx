import styles from './SearchFilters.module.css'

export const GENRES = [
  'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime', 'Documentary', 'Drama',
  'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War',
]
const TYPES = [
  { value: '', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'series', label: 'TV series' },
]

export default function SearchFilters({ filters, onChange }) {
  return (
    <div className={styles.bar}>
      <div className={styles.pills} role="group" aria-label="Type">
        {TYPES.map((t) => (
          <button
            key={t.value}
            className={`${styles.pill} ${filters.type === t.value ? styles.on : ''}`}
            onClick={() => onChange({ type: t.value })}
          >
            {t.label}
          </button>
        ))}
      </div>

      <select value={filters.lang} onChange={(e) => onChange({ lang: e.target.value })} aria-label="Language">
        <option value="">Any language</option>
        <option>Hindi</option>
        <option>English</option>
        <option>Bengali</option>
      </select>

      <select value={filters.genre} onChange={(e) => onChange({ genre: e.target.value })} aria-label="Genre">
        <option value="">Any genre</option>
        {GENRES.map((g) => <option key={g}>{g}</option>)}
      </select>

      <input
        className={styles.year}
        type="number"
        inputMode="numeric"
        min="1900"
        max="2100"
        placeholder="Year"
        value={filters.year}
        onChange={(e) => onChange({ year: e.target.value.slice(0, 4) })}
        aria-label="Release year"
      />

      <select value={filters.minRating} onChange={(e) => onChange({ minRating: e.target.value })} aria-label="Minimum rating">
        <option value="">Any rating</option>
        <option value="6">6+ IMDb</option>
        <option value="7">7+ IMDb</option>
        <option value="8">8+ IMDb</option>
      </select>

      <select value={filters.sort} onChange={(e) => onChange({ sort: e.target.value })} aria-label="Sort">
        <option value="relevance">Sort: Relevance</option>
        <option value="newest">Sort: Newest</option>
        <option value="rating">Sort: Top rated</option>
      </select>
    </div>
  )
}
