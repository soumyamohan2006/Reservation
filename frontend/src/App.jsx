import { useState, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import api from './services/api'
import { useBackendWakeup, MOCK_HALLS } from './hooks/useBackendWakeup'

import ThemeLayout from './components/ThemeLayout'

import SpacesPage from './pages/SpacesPage'
import AdminPage from './pages/AdminPage'
import CustodianPage from './pages/CustodianPage'
import ProfilePage from './pages/ProfilePage'
import MyBookingsPage from './pages/MyBookingsPage'
import HallDetailsPage from './pages/HallDetailsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SetPasswordPage from './pages/SetPasswordPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import HomePage from './pages/HomePage'
import ReservePage from './pages/ReservePage'


function App() {
  const [user, setUser] = useState(() => localStorage.getItem('user') || null)
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [role, setRole] = useState(() => localStorage.getItem('role') || null)
  const [halls, setHalls] = useState([])

  // Backend wakeup detection — pings server, shows toast, returns isWaking
  const { isWaking } = useBackendWakeup()

  const fetchHalls = async () => {
    try {
      const data = await api.getHalls()
      if (Array.isArray(data)) {
        const normalizedHalls = data.map(h => ({ ...h, id: h._id }))
        setHalls(normalizedHalls)
      }
    } catch (err) {
      console.error('Failed to fetch spaces:', err)
    }
  }

  useEffect(() => {
    // When waking up finishes, fetch real halls; meanwhile use mocks
    if (!isWaking) {
      fetchHalls()
    }
  }, [isWaking, token])

  // While backend wakes up, show placeholder cards so the site doesn't look empty
  const displayHalls = halls.length > 0 ? halls : (isWaking ? MOCK_HALLS : [])

  return (
    <ThemeLayout>
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#1e1e20',
          color: '#e5e2e3',
          border: '1px solid rgba(173,198,255,0.2)',
          fontFamily: 'Inter',
          borderRadius: '0.75rem',
          fontSize: '0.875rem',
        }
      }}/>
      <Routes>
        <Route path="/login" element={<LoginPage setUser={setUser} setToken={setToken} setRole={setRole} />} />
        <Route path="/login/:hallId" element={<LoginPage setUser={setUser} setToken={setToken} setRole={setRole} />} />
        <Route path="/register" element={<RegisterPage setUser={setUser} setToken={setToken} setAppRole={setRole} />} />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/" element={<HomePage halls={displayHalls} user={user} role={role} isWaking={isWaking} />} />
        <Route path="/halls/:hallId" element={user ? <HallDetailsPage halls={displayHalls} /> : <Navigate to="/login" replace />} />
        <Route path="/spaces" element={user ? <SpacesPage halls={displayHalls} /> : <Navigate to="/login" replace />} />
        <Route path="/spaces/:hallId" element={user ? <SpacesPage halls={displayHalls} /> : <Navigate to="/login" replace />} />
        <Route path="/reserve/:hallId" element={user ? <ReservePage halls={displayHalls} token={token} /> : <Navigate to="/login" replace />} />
        <Route path="/book/:hallId" element={user ? <ReservePage halls={displayHalls} token={token} /> : <Navigate to="/login" replace />} />
        <Route path="/admin" element={role === 'admin' ? <AdminPage token={token} role={role} /> : <Navigate to="/login" replace />} />
        <Route path="/custodian" element={role === 'custodian' ? <CustodianPage token={token} user={user} /> : <Navigate to="/login" replace />} />
        {/* Legacy login routes → unified login */}
        <Route path="/custodian-login" element={<Navigate to="/login" replace />} />
        <Route path="/admin-login" element={<Navigate to="/login" replace />} />
        <Route path="/profile" element={user ? <ProfilePage user={user} role={role} token={token} /> : <Navigate to="/login" replace />} />
        <Route path="/bookings" element={user ? <MyBookingsPage user={user} token={token} /> : <Navigate to="/login" replace />} />
      </Routes>
    </ThemeLayout>
  )
}

export default App
