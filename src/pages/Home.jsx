import { useCuratedList } from '../hooks/useCuratedList.js'
import HeroBanner from '../components/HeroBanner.jsx'
import MovieCarousel from '../components/MovieCarousel.jsx'
import { SkeletonHero } from '../components/SkeletonLoader.jsx'

// Each row = one curated list in Supabase. (OMDb has no "trending" feed, so these are hand-picked.)
const ROWS = [
  'top-rated-movies',
  'acclaimed-series',
  'hindi-cinema',
  'hindi-series',
  'bengali-cinema',
  'thrillers',
]

function Row({ slug }) {
  const { title, items, loading, error } = useCuratedList(slug)
  return <MovieCarousel title={title} items={items} loading={loading} error={error} />
}

export default function Home() {
  const featured = useCuratedList('featured')
  const hero = featured.items.find((i) => i.poster && i.plot)

  return (
    <>
      {featured.loading ? (
        <SkeletonHero />
      ) : hero ? (
        <HeroBanner item={hero} />
      ) : (
        <div style={{ padding: '160px var(--gutter) 40px' }}>
          <h1 style={{ color: 'var(--gold)' }}>SCREENVAULT</h1>
          {featured.error && <p style={{ color: 'var(--muted)', marginTop: 12 }}>{featured.error}</p>}
        </div>
      )}
      <div style={{ marginTop: -50, position: 'relative' }}>
        <MovieCarousel title={featured.title} items={featured.items} loading={featured.loading} error={null} />
        {ROWS.map((slug) => (
          <Row key={slug} slug={slug} />
        ))}
      </div>
    </>
  )
}
