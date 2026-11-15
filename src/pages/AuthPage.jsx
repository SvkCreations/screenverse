import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabaseReady } from '../services/supabase.js'
import styles from './AuthPage.module.css'

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup'
  const { user, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  if (user) return <Navigate to={isSignup ? '/profile' : from} replace />

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setBusy(true)
    try {
      if (isSignup) {
        const { needsConfirmation } = await signUp(email.trim(), password)
        if (needsConfirmation) setNotice('Account created. Check your email and click the confirmation link, then log in.')
        else navigate('/profile', { replace: true })
      } else {
        await signIn(email.trim(), password)
        navigate(from, { replace: true })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={onSubmit}>
        <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <p className={styles.sub}>
          {isSignup ? 'Save your watchlist, favourites and AI preferences.' : 'Log in to see your saved titles.'}
        </p>

        {!supabaseReady && <p className={styles.error}>Supabase isn’t configured. Check your .env file.</p>}

        <label>
          Email
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={6}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}
        {notice && <p className={styles.notice}>{notice}</p>}

        <button type="submit" disabled={busy || !supabaseReady}>
          {busy ? 'Please wait…' : isSignup ? 'Sign up' : 'Log in'}
        </button>

        <p className={styles.switch}>
          {isSignup ? (
            <>Already have an account? <Link to="/login">Log in</Link></>
          ) : (
            <>New here? <Link to="/signup">Create an account</Link></>
          )}
        </p>
        <p className={styles.guest}><Link to="/">Continue browsing as a guest</Link></p>
      </form>
    </main>
  )
}
