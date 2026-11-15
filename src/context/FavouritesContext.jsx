import { createContext, useContext } from 'react'
import { useSyncedList } from '../hooks/useSyncedList.js'

const FavouritesContext = createContext(null)

export function FavouritesProvider({ children }) {
  const value = useSyncedList('favourites', 'sv_favourites')
  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>
}

export function useFavourites() {
  const ctx = useContext(FavouritesContext)
  if (!ctx) throw new Error('useFavourites must be used inside FavouritesProvider')
  return ctx
}
