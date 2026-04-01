import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config'

export default function CustodianLoginPage({ setUser, setToken, setRole }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      if (data.role !== 'custodian') {
        setError('Access denied. Custodian accounts only.')
        return
      }
      localStorage.setItem('user', data.name)
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)
      setUser(data.name)
      setToken(data.token)
      setRole(data.role)
      navigate('/custodian')
    } catch {
      setError('Server error. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', background: '#020b2f' }}>

      {/* Left branding panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', borderRight: '1px solid #1e3a8a' }}>
        <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🧑‍💼</div>
        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 800, margin: 0, textAlign: 'center' }}>Custodian Portal</h1>
        <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '0.75rem', textAlign: 'center', maxWidth: '280px', lineHeight: 1.6 }}>
          Manage hall bookings, approve requests, and control facility availability.
        </p>
        <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '260px' }}>
          {[
            { icon: '📋', label: 'Review booking requests' },
            { icon: '✅', label: 'Approve or reject bookings' },
            { icon: '📅', label: 'View facility schedule' },
            { icon: '🚫', label: 'Block unavailable slots' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontSize: '0.9rem' }}>
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Right login form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#1e1b4b', border: '1px solid #4338ca', borderRadius: '999px', padding: '0.3rem 0.9rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 600 }}>🔐 SECURE ACCESS</span>
            </div>
            <h2 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Sign in</h2>
            <p style={{ color: '#475569', fontSize: '0.9rem', marginTop: '0.4rem' }}>Enter your custodian credentials to continue</p>
          </div>

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>
              Email Address
              <input
                type="email"
                placeholder="custodian@campus.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ padding: '0.75rem 1rem', background: '#0f172a', border: '1px solid #1e3a8a', borderRadius: '0.5rem', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>
              Password
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ padding: '0.75rem 1rem', background: '#0f172a', border: '1px solid #1e3a8a', borderRadius: '0.5rem', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
              />
            </label>

            {error && (
              <div style={{ padding: '0.65rem 0.9rem', background: '#450a0a', border: '1px solid #b91c1c', borderRadius: '0.5rem', color: '#fca5a5', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: '0.25rem', padding: '0.8rem', background: loading ? '#3730a3' : 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Signing in...' : '🧑‍💼 Sign In to Custodian Panel'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.5rem' }}>
            <p style={{ color: '#475569', fontSize: '0.8rem', margin: '0 0 0.4rem', fontWeight: 600 }}>DEFAULT CREDENTIALS</p>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Email: <span style={{ color: '#93c5fd' }}>custodian@campus.com</span></p>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>Password: <span style={{ color: '#93c5fd' }}>custodian123</span></p>
          </div>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#334155' }}>
            Admin?{' '}
            <a href="/admin-login" style={{ color: '#4169e1', fontWeight: 600, textDecoration: 'none' }}>Go to Admin login</a>
            {' · '}
            <a href="/login" style={{ color: '#4169e1', fontWeight: 600, textDecoration: 'none' }}>User login</a>
          </p>
        </div>
      </div>
    </main>
  )
}
