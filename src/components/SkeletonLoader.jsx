import styles from './SkeletonLoader.module.css'

export function SkeletonCard() {
  return <div className={styles.card} aria-hidden="true" />
}

export function SkeletonRow({ count = 8 }) {
  return (
    <div className={styles.row} aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonHero() {
  return <div className={styles.hero} aria-label="Loading" />
}
