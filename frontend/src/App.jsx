import { useState, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import api from './services/api'

import ThemeLayout from './components/ThemeLayout'

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
import ProfilePage from './pages/ProfilePage'
import MyBookingsPage from './pages/MyBookingsPage'

function App() {
  const [user, setUser] = useState(() => localStorage.getItem('user') || null)
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [role, setRole] = useState(() => localStorage.getItem('role') || null)
  const [halls, setHalls] = useState([])

  const fetchHalls = async () => {
    try {
      const data = await api.getHalls()
      if (Array.isArray(data)) {
        // Map _id for frontend compatibility so old components still work without refactor overhead
        const normalizedHalls = data.map(h => ({
          ...h,
          id: h._id,
        }))
        setHalls(normalizedHalls)
      }
    } catch (err) {
      console.error('Failed to fetch spaces:', err)
    }
  }

  // Fetch on mount and whenever token changes (after login)
  useEffect(() => { fetchHalls() }, [token])

  return (
    <ThemeLayout>
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: '#201f20',
          color: '#e5e2e3',
          border: '1px solid #424754',
          fontFamily: 'Inter',
        }
      }}/>
      <Routes>
        <Route path="/login" element={<LoginPage setUser={setUser} setToken={setToken} setRole={setRole} />} />
        <Route path="/login/:hallId" element={<LoginPage setUser={setUser} setToken={setToken} setRole={setRole} />} />
        <Route path="/register" element={<RegisterPage setUser={setUser} setToken={setToken} setAppRole={setRole} />} />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/" element={<HomePage halls={halls} user={user} role={role} />} />
        <Route path="/halls/:hallId" element={user ? <HallDetailsPage halls={halls} /> : <Navigate to="/login" replace />} />
        <Route path="/spaces" element={user ? <SpacesPage halls={halls} /> : <Navigate to="/login" replace />} />
        <Route path="/spaces/:hallId" element={user ? <SpacesPage halls={halls} /> : <Navigate to="/login" replace />} />
        <Route path="/reserve/:hallId" element={user ? <ReservePage halls={halls} token={token} /> : <Navigate to="/login" replace />} />
        <Route path="/book/:hallId" element={user ? <ReservePage halls={halls} token={token} /> : <Navigate to="/login" replace />} />
        <Route path="/admin" element={role === 'admin' ? <AdminPage token={token} role={role} /> : <Navigate to="/admin-login" replace />} />
        <Route path="/custodian" element={role === 'custodian' ? <CustodianPage token={token} user={user} /> : <Navigate to="/custodian-login" replace />} />
        <Route path="/custodian-login" element={role === 'custodian' ? <Navigate to="/custodian" replace /> : <CustodianLoginPage setUser={setUser} setToken={setToken} setRole={setRole} />} />
        <Route path="/admin-login" element={role === 'admin' ? <Navigate to="/admin" replace /> : role === 'custodian' ? <Navigate to="/custodian" replace /> : <AdminLoginPage setUser={setUser} setToken={setToken} setRole={setRole} />} />
        
        <Route path="/profile" element={user ? <ProfilePage user={user} role={role} /> : <Navigate to="/login" replace />} />
        <Route path="/bookings" element={user ? <MyBookingsPage user={user} token={token} /> : <Navigate to="/login" replace />} />
      </Routes>
    </ThemeLayout>
  )
}

export default App
