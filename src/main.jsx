import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { WatchlistProvider } from './context/WatchlistContext.jsx'
import { FavouritesProvider } from './context/FavouritesContext.jsx'
import { PreviewProvider } from './context/PreviewContext.jsx'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <WatchlistProvider>
            <FavouritesProvider>
              <PreviewProvider>
                <App />
              </PreviewProvider>
            </FavouritesProvider>
          </WatchlistProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
