import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch((e) => console.warn('getSession failed:', e.message))
      .finally(() => setLoading(false))

    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const signUp = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)
    // If email confirmation is ON in your project, there is no session until the email link is clicked.
    return { needsConfirmation: !data.session }
  }, [])

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }, [])

  const user = session?.user ?? null
  const value = useMemo(
    () => ({ user, loading, signUp, signIn, signOut }),
    [user, loading, signUp, signIn, signOut]
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
