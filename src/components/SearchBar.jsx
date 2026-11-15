import { useState } from 'react'
import { Search, X, Clock } from 'lucide-react'
import styles from './SearchBar.module.css'

export default function SearchBar({ value, onChange, onSubmit, history, onPickHistory, onClearHistory }) {
  const [focused, setFocused] = useState(false)
  const showHistory = focused && value.trim() === '' && history.length > 0

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(value)
      }}
    >
      <Search size={20} className={styles.icon} />
      <input
        className={styles.input}
        type="search"
        placeholder="Search a movie or series title…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus
        aria-label="Search titles"
      />
      {value && (
        <button type="button" className={styles.clear} onClick={() => onChange('')} aria-label="Clear search">
          <X size={18} />
        </button>
      )}
      {showHistory && (
        <div className={styles.dropdown}>
          <div className={styles.dropHead}>
            <span>Recent searches</span>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); onClearHistory() }}>Clear</button>
          </div>
          {history.map((h) => (
            <button
              type="button"
              key={h}
              className={styles.item}
              onMouseDown={(e) => { e.preventDefault(); onPickHistory(h) }}
            >
              <Clock size={14} /> {h}
            </button>
          ))}
        </div>
      )}
    </form>
  )
}
