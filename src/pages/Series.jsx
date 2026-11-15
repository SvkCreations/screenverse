import CatalogView from '../components/CatalogView.jsx'
import { useCuratedPool } from '../hooks/useCuratedPool.js'
import { ALL_SLUGS } from '../utils/catalog.js'

export default function Series() {
  const { items, loading, error } = useCuratedPool(ALL_SLUGS)
  return (
    <CatalogView
      title="TV Series"
      blurb="Acclaimed television series to binge."
      items={items.filter((i) => i.type === 'series')}
      loading={loading}
      error={error}
      lockedType="series"
    />
  )
}
