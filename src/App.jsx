import { Routes, Route, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import PreviewPopover from './components/PreviewPopover.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Search from './pages/Search.jsx'
import TitleDetails from './pages/TitleDetails.jsx'
import AICinema from './pages/AICinema.jsx'
import AuthPage from './pages/AuthPage.jsx'
import Profile from './pages/Profile.jsx'
import Watchlist from './pages/Watchlist.jsx'
import Movies from './pages/Movies.jsx'
import Series from './pages/Series.jsx'
import LanguagePage from './pages/LanguagePage.jsx'
import Upcoming from './pages/Upcoming.jsx'
import NotFound from './pages/NotFound.jsx'

function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
      <PreviewPopover />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/series" element={<Series />} />
        <Route path="/upcoming" element={<Upcoming />} />
        <Route path="/language/:lang" element={<LanguagePage />} />
        <Route path="/search" element={<Search />} />
        <Route path="/title/:id" element={<TitleDetails />} />
        <Route path="/ai" element={<AICinema />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
