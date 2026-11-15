import CatalogView from '../components/CatalogView.jsx'
import { useCuratedPool } from '../hooks/useCuratedPool.js'
import { ALL_SLUGS } from '../utils/catalog.js'

export default function Movies() {
  const { items, loading, error } = useCuratedPool(ALL_SLUGS)
  return (
    <CatalogView
      title="Movies"
      blurb="Acclaimed films across English, Hindi and Bengali cinema."
      items={items.filter((i) => i.type === 'movie')}
      loading={loading}
      error={error}
      lockedType="movie"
    />
  )
}
