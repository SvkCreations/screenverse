import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import ChipGroup from './ChipGroup.jsx'
import RecommendationSection from './RecommendationSection.jsx'
import { getRecommendations } from '../services/gemini.js'
import { supabase } from '../services/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { MOODS, TASTES, AI_GENRES, LANGUAGES } from '../utils/aiOptions.js'
import styles from './GuidedDiscovery.module.css'

const KEY = 'sv_ai_prefs'
const EMPTY = { mood: '', tastes: [], genres: [], language: '', type: '' }

function cleanPrefs(p) {
  if (!p || typeof p !== 'object') return EMPTY
  return {
    mood: typeof p.mood === 'string' ? p.mood : '',
    tastes: Array.isArray(p.tastes) ? p.tastes.filter((x) => typeof x === 'string') : [],
    genres: Array.isArray(p.genres) ? p.genres.filter((x) => typeof x === 'string') : [],
    language: typeof p.language === 'string' ? p.language : '',
    type: ['movie', 'series'].includes(p.type) ? p.type : '',
  }
}

function loadPrefs() {
  try {
    return cleanPrefs(JSON.parse(localStorage.getItem(KEY) || 'null'))
  } catch {
    return EMPTY
  }
}

export default function GuidedDiscovery() {
  const [prefs, setPrefs] = useState(loadPrefs) // remembered on this device; synced to your account in Phase 5
  const [state, setState] = useState({ loading: false, error: null, result: null })
  const shown = useRef([]) // titles already shown, so "Regenerate" gives new ones
  const resultsRef = useRef(null)
  const { user } = useAuth()
  const [saveState, setSaveState] = useState({ saving: false, msg: null })

  // Logged in: load the preferences saved to the account
  useEffect(() => {
    if (!user || !supabase) return
    let cancelled = false
    supabase
      .from('user_preferences')
      .select('ai_prefs')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled || error || !data?.ai_prefs || Object.keys(data.ai_prefs).length === 0) return
        setPrefs(cleanPrefs(data.ai_prefs))
      })
    return () => {
      cancelled = true
    }
  }, [user])

  async function savePrefs() {
    setSaveState({ saving: true, msg: null })
    const { error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: user.id, ai_prefs: prefs, updated_at: new Date().toISOString() })
    setSaveState({ saving: false, msg: error ? 'Could not save. Try again.' : 'Preferences saved to your account.' })
  }

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs))
    } catch {
      // ignore
    }
  }, [prefs])

  const set = (patch) => setPrefs((p) => ({ ...p, ...patch }))
  const hasChoice = Boolean(prefs.mood || prefs.tastes.length || prefs.genres.length)

  async function run(fresh) {
    if (fresh) shown.current = []
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const result = await getRecommendations({
        mode: 'guided',
        mood: prefs.mood,
        tastes: prefs.tastes,
        genres: prefs.genres,
        language: prefs.language,
        type: prefs.type,
        exclude: shown.current.slice(-30),
      })
      shown.current.push(...result.items.map((i) => i.title))
      setState({ loading: false, error: null, result })
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e.message }))
    }
  }

  const { loading, error, result } = state

  return (
    <div>
      <ChipGroup label="Your mood" hint="pick one" options={MOODS} value={prefs.mood} onChange={(mood) => set({ mood })} />
      <ChipGroup label="Your taste" hint="pick any" multi options={TASTES} value={prefs.tastes} onChange={(tastes) => set({ tastes })} />
      <ChipGroup label="Genres" hint="pick any" multi options={AI_GENRES} value={prefs.genres} onChange={(genres) => set({ genres })} />

      <div className={styles.row}>
        <ChipGroup label="Language" hint="optional" options={LANGUAGES} value={prefs.language} onChange={(language) => set({ language })} />
        <ChipGroup
          label="Format"
          options={['Movies', 'Series']}
          value={prefs.type === 'movie' ? 'Movies' : prefs.type === 'series' ? 'Series' : ''}
          onChange={(v) => set({ type: v === 'Movies' ? 'movie' : v === 'Series' ? 'series' : '' })}
          hint="none selected = both"
        />
      </div>

      <div className={styles.cta}>
        <button onClick={() => run(true)} disabled={!hasChoice || loading}>
          <Sparkles size={18} /> {loading && !result ? 'Finding your next story…' : 'Find my next story'}
        </button>
        {!hasChoice && <span>Pick at least a mood, a taste or a genre.</span>}
        {hasChoice && (
          <button className={styles.reset} onClick={() => { setPrefs(EMPTY); setState({ loading: false, error: null, result: null }) }}>
            Reset
          </button>
        )}
      </div>

      <p className={styles.save}>
        {user ? (
          <>
            <button onClick={savePrefs} disabled={saveState.saving || !hasChoice}>
              {saveState.saving ? 'Saving…' : 'Save these preferences'}
            </button>
            {saveState.msg && <span>{saveState.msg}</span>}
          </>
        ) : (
          <span><Link to="/login" state={{ from: '/ai' }}>Log in</Link> to save these preferences to your account.</span>
        )}
      </p>

      <div ref={resultsRef} />
      {error && <p className={styles.error}>{error}</p>}
      {result && (
        <RecommendationSection
          strategy={result.strategy}
          items={result.items}
          dropped={result.dropped}
          onRegenerate={() => run(false)}
          loading={loading}
        />
      )}
    </div>
  )
}
