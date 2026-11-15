import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main style={{ padding: '160px var(--gutter) 80px', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>Page not found</h1>
      <p style={{ color: 'var(--muted)', margin: '12px 0 24px' }}>That page doesn’t exist.</p>
      <Link to="/" style={{ color: 'var(--champagne)' }}>← Back to home</Link>
    </main>
  )
}
