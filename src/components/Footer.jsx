import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.logo}>
        SCREEN<span>VAULT</span>
      </div>
      <p>Your Cinema. One Destination.</p>
      <p className={styles.small}>
        SCREENVAULT is a discovery site and does not host or stream any films or series. Ratings and details
        come from OMDb (IMDb data).
      </p>
    </footer>
  )
}
