import { useState, useEffect } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import { API_URL } from './config'
import staticHalls from './data/halls'
import HallDetailsPage from './pages/HallDetailsPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ReservePage from './pages/ReservePage'
import RegisterPage from './pages/RegisterPage'
import SpacesPage from './pages/SpacesPage'
import AdminPage from './pages/AdminPage'
import SetPasswordPage from './pages/SetPasswordPage'
import AdminLoginPage from './pages/AdminLoginPage'
import CustodianPage from './pages/CustodianPage'
import CustodianLoginPage from './pages/CustodianLoginPage'

function App() {
  const { pathname } = useLocation()
  const isBookingPage = pathname.startsWith('/reserve/') || pathname.startsWith('/book/')
  const isSpacesPage = pathname.startsWith('/spaces')
  const isLoginPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isPrivatePage = isBookingPage || isSpacesPage
  const isLightLayout = isPrivatePage || isLoginPage
  const [headerNotice, setHeaderNotice] = useState('')
  const [user, setUser] = useState(() => localStorage.getItem('user') || null)
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [role, setRole] = useState(() => localStorage.getItem('role') || null)
  const [dbHalls, setDbHalls] = useState([])

  const fetchHalls = () => {
    fetch(`${API_URL}/api/halls`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const merged = staticHalls.map(sh => {
            const match = data.find(dh => dh.name.toLowerCase() === sh.name.toLowerCase())
            return match ? { ...sh, mongoId: match._id } : sh
          })
          setDbHalls(merged)
        }
      })
      .catch(() => {})
  }

  // Fetch on mount and whenever token changes (after login)
  useEffect(() => { fetchHalls() }, [token])

  const halls = dbHalls.length > 0 ? dbHalls : staticHalls

  const handleSignOut = () => {
    setUser(null)
    setToken(null)
    setRole(null)
    setHeaderNotice('')
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('role')
  }

  return (
    <div className={`app-shell ${isLightLayout ? 'app-shell-light' : ''}`}>
      <header className={`top-header ${isLightLayout ? 'top-header-light' : ''}`}>
        <nav className="nav-bar">
          <Link to="/" className="brand">
            <span className="brand-logo">CS</span>
            Campus Spaces
          </Link>

          {user ? (
            <>
              <div className="nav-center-links">
                <Link to="/" className="nav-link">Catalog</Link>
                {role === 'admin' && <Link to="/admin" className="nav-link">Admin Panel</Link>}
                {role === 'custodian' && <Link to="/custodian" className="nav-link">Custodian Panel</Link>}
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
            <span>{headerNotice}</span>
          </div>
        )}
      </header>

      <Routes>
        <Route path="/login" element={<LoginPage setUser={setUser} setToken={setToken} setRole={setRole} />} />
        <Route path="/login/:hallId" element={<LoginPage setUser={setUser} setToken={setToken} setRole={setRole} />} />
        <Route path="/register" element={<RegisterPage setUser={setUser} setToken={setToken} setAppRole={setRole} />} />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/" element={<HomePage halls={halls} user={user} role={role} />} />
        <Route path="/halls/:hallId" element={user ? <HallDetailsPage halls={halls} /> : <Navigate to="/login" replace />} />
        <Route path="/spaces" element={user ? <SpacesPage halls={halls} /> : <Navigate to="/login" replace />} />
        <Route path="/spaces/:hallId" element={user ? <SpacesPage halls={halls} /> : <Navigate to="/login" replace />} />
        <Route path="/reserve/:hallId" element={user ? <ReservePage halls={halls} setHeaderNotice={setHeaderNotice} token={token} /> : <Navigate to="/login" replace />} />
        <Route path="/book/:hallId" element={user ? <ReservePage halls={halls} setHeaderNotice={setHeaderNotice} token={token} /> : <Navigate to="/login" replace />} />
        <Route path="/admin" element={role === 'admin' ? <AdminPage token={token} role={role} /> : <Navigate to="/admin-login" replace />} />
        <Route path="/custodian" element={role === 'custodian' ? <CustodianPage token={token} user={user} /> : <Navigate to="/custodian-login" replace />} />
        <Route path="/custodian-login" element={role === 'custodian' ? <Navigate to="/custodian" replace /> : <CustodianLoginPage setUser={setUser} setToken={setToken} setRole={setRole} />} />
        <Route path="/admin-login" element={role === 'admin' ? <Navigate to="/admin" replace /> : role === 'custodian' ? <Navigate to="/custodian" replace /> : <AdminLoginPage setUser={setUser} setToken={setToken} setRole={setRole} />} />
      </Routes>
    </div>
  )
}

export default App
