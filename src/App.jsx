import { useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import halls from './data/halls'
import HallDetailsPage from './pages/HallDetailsPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ReservePage from './pages/ReservePage'
import RegisterPage from './pages/RegisterPage'
import SpacesPage from './pages/SpacesPage'

function App() {
  const { pathname } = useLocation()
  const isBookingPage = pathname.startsWith('/reserve/') || pathname.startsWith('/book/')
  const isSpacesPage = pathname.startsWith('/spaces')
  const isLoginPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isPrivatePage = isBookingPage || isSpacesPage
  const isLightLayout = isPrivatePage || isLoginPage
  const [headerNotice, setHeaderNotice] = useState('')
  const [user, setUser] = useState(null)

  const handleSignOut = () => {
    setUser(null)
    setHeaderNotice('')
  }

  return (
    <div className={`app-shell ${isLightLayout ? 'app-shell-light' : ''}`}>
      <header className={`top-header ${isLightLayout ? 'top-header-light' : ''}`}>
        <nav className="nav-bar">
          <Link to="/" className="brand">
            Campus Space Reservation
          </Link>

          {user ? (
            <>
              <div className="nav-center-links">
                <Link to="/" className="nav-link">
                  Catalog
                </Link>
                {isPrivatePage && (
                  <Link to="/spaces" className="nav-link">
                    Spaces
                  </Link>
                )}
              </div>
              <div className="nav-auth-btns">
                <span className="nav-username">👤 {user}</span>
                <Link
                  to="/"
                  className="signout-link nav-link"
                  onClick={handleSignOut}
                >
                  <span className="signout-logo" aria-hidden="true" />
                  <span>Sign out</span>
                </Link>
              </div>
            </>
          ) : isLoginPage ? (
            <>
              <div className="nav-center-links">
                <Link to="/" className="nav-link nav-link-dark">
                  Catalog
                </Link>
              </div>
              <div className="nav-auth-btns">
                <Link to="/register" className="btn btn-primary btn-nav">
                  Register
                </Link>
                <Link to="/login" className="btn btn-primary btn-nav">
                  Login
                </Link>
              </div>
            </>
          ) : (
            <>
              <Link to="/" className="nav-link">
                Catalog
              </Link>
              <div className="nav-auth-btns">
                <Link to="/register" className="btn btn-primary btn-nav">
                  Register
                </Link>
                <Link to="/login" className="btn btn-primary btn-nav">
                  Login
                </Link>
              </div>
            </>
          )}
        </nav>
        {headerNotice && (
          <div className="header-popup" role="status" aria-live="polite">
            <div className="header-popup-head">
              <strong>Booking Request Submitted</strong>
              <button
                type="button"
                className="header-popup-close"
                aria-label="Close booking message"
                onClick={() => setHeaderNotice('')}
              >
                &times;
              </button>
            </div>
            <span>
              Your request to reserve the Main Auditorium has been submitted successfully. Approval
              from the administration is pending.
            </span>
          </div>
        )}
      </header>

      <Routes>
        <Route path="/" element={<HomePage halls={halls} />} />
        <Route path="/halls/:hallId" element={<HallDetailsPage halls={halls} />} />
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/login/:hallId" element={<LoginPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage setUser={setUser} />} />
        <Route path="/spaces" element={<SpacesPage halls={halls} />} />
        <Route path="/spaces/:hallId" element={<SpacesPage halls={halls} />} />
        <Route path="/reserve/:hallId" element={<ReservePage halls={halls} setHeaderNotice={setHeaderNotice} />} />
        <Route path="/book/:hallId" element={<ReservePage halls={halls} setHeaderNotice={setHeaderNotice} />} />
        <Route path="*" element={<HomePage halls={halls} />} />
      </Routes>
    </div>
  )
}

export default App
