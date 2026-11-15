import { Link, useParams } from 'react-router-dom'
import CatalogView from '../components/CatalogView.jsx'
import { useCuratedPool } from '../hooks/useCuratedPool.js'
import { ALL_SLUGS, LANGUAGE_PAGES } from '../utils/catalog.js'

export default function LanguagePage() {
  const { lang } = useParams()
  const language = LANGUAGE_PAGES[lang?.toLowerCase()]
  const { items, loading, error } = useCuratedPool(ALL_SLUGS)

  if (!language) {
    return (
      <main style={{ padding: '160px var(--gutter)', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--gold)' }}>Language not found</h2>
        <p style={{ margin: '12px 0' }}>Try Hindi, English or Bengali.</p>
        <Link to="/" style={{ color: 'var(--champagne)' }}>← Home</Link>
      </main>
    )
  }

  // Language comes from each title's OMDb "Language" field, not from its country.
  const filtered = items.filter((i) => i.languages.includes(language))

  return (
    <CatalogView
      key={language}
      title={`${language} Movies & Series`}
      blurb={`Titles where ${language} is a listed language.`}
      items={filtered}
      loading={loading}
      error={error}
    >
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>
        New and upcoming releases: <Link to="/upcoming" style={{ color: 'var(--champagne)' }}>Upcoming</Link>
      </p>
    </CatalogView>
  )
}
