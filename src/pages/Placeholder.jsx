import { Link, useLocation } from 'react-router-dom'

// Temporary page for routes we build in later phases, so no nav link is a dead end.
export default function Placeholder() {
  const { pathname } = useLocation()
  return (
    <main style={{ padding: '160px var(--gutter) 80px', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>Coming soon</h1>
      <p style={{ color: 'var(--muted)', margin: '12px 0 24px' }}>
        <code>{pathname}</code> is built in an upcoming phase.
      </p>
      <Link to="/" style={{ color: 'var(--champagne)' }}>← Back to home</Link>
    </main>
  )
}
