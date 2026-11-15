import { Star } from 'lucide-react'
import styles from './RatingBadge.module.css'

// variant "imdb" = gold star badge. Others are plain labelled values from OMDb.
export default function RatingBadge({ label, value, sub, variant = 'other' }) {
  if (!value) return null
  return (
    <div className={`${styles.badge} ${variant === 'imdb' ? styles.imdb : ''}`}>
      {variant === 'imdb' && <Star size={20} fill="currentColor" />}
      <div>
        <div className={styles.value}>{value}</div>
        <div className={styles.label}>{label}{sub ? ` · ${sub}` : ''}</div>
      </div>
    </div>
  )
}
