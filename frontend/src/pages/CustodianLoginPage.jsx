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
    <main style={{ minHeight: '100vh', display: 'flex', background: '#f1f5f9' }}>

      {/* Left branding panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3rem', background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', borderRight: '1px solid #93c5fd' }}>
        <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🧑💼</div>
        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 800, margin: 0, textAlign: 'center' }}>Custodian Portal</h1>
        <p style={{ color: '#e0f2fe', fontSize: '1rem', marginTop: '0.75rem', textAlign: 'center', maxWidth: '280px', lineHeight: 1.6 }}>
          Manage hall bookings, approve requests, and control facility availability.
        </p>
        <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '260px' }}>
          {[
            { icon: '📋', label: 'Review booking requests' },
            { icon: '✅', label: 'Approve or reject bookings' },
            { icon: '📅', label: 'View facility schedule' },
            { icon: '🚫', label: 'Block unavailable slots' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ffffff', fontSize: '0.9rem' }}>
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Right login form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#ffffff' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '999px', padding: '0.3rem 0.9rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 600 }}>🔐 SECURE ACCESS</span>
            </div>
            <h2 style={{ color: '#1e293b', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Sign in</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.4rem' }}>Enter your custodian credentials to continue</p>
          </div>

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>
              Email Address
              <input
                type="email"
                placeholder="custodian@campus.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0.5rem', color: '#0f172a', fontSize: '0.95rem', outline: 'none' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>
              Password
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0.5rem', color: '#0f172a', fontSize: '0.95rem', outline: 'none' }}
              />
            </label>

            {error && (
              <div style={{ padding: '0.65rem 0.9rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '0.5rem', color: '#b91c1c', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: '0.25rem', padding: '0.8rem', background: loading ? '#60a5fa' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Signing in...' : '🧑💼 Sign In to Custodian Panel'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
            <p style={{ color: '#475569', fontSize: '0.8rem', margin: '0 0 0.4rem', fontWeight: 600 }}>DEFAULT CREDENTIALS</p>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Email: <span style={{ color: '#3b82f6' }}>custodian@campus.com</span></p>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>Password: <span style={{ color: '#3b82f6' }}>custodian123</span></p>
          </div>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
            Admin?{' '}
            <a href="/admin-login" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>Go to Admin login</a>
            {' · '}
            <a href="/login" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>User login</a>
          </p>
        </div>
      </div>
    </main>
  )
}
