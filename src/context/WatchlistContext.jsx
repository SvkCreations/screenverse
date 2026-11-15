import { createContext, useContext } from 'react'
import { useSyncedList } from '../hooks/useSyncedList.js'

const WatchlistContext = createContext(null)

export function WatchlistProvider({ children }) {
  const value = useSyncedList('watchlist', 'sv_watchlist')
  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext)
  if (!ctx) throw new Error('useWatchlist must be used inside WatchlistProvider')
  return ctx
}
