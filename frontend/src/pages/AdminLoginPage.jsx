import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function AdminLoginPage({ setUser, setToken, setRole }) {
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
      const data = await api.adminLogin({ email, password })
      if (data.role !== 'admin' && data.role !== 'custodian') {
        setError('Access denied. Admin or Custodian accounts only.')
        return
      }
      localStorage.setItem('user', data.name)
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)
      setUser(data.name)
      setToken(data.token)
      setRole(data.role)
      navigate(data.role === 'custodian' ? '/custodian' : '/admin')
    } catch (err) {
      setError(err?.data?.message || 'Server error. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020b2f' }}>
      <section style={{ background: '#0f172a', border: '1px solid #1e3a8a', borderRadius: '1rem', padding: '2.5rem 2rem', width: '100%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏛️</div>
          <h1 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Admin Portal</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.4rem' }}>Sign in with your admin or custodian account</p>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600 }}>
            Email
            <input
              type="email"
              placeholder="admin@campus.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ padding: '0.65rem 0.9rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600 }}>
            Password
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ padding: '0.65rem 0.9rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
            />
          </label>

          {error && (
            <p style={{ color: '#fca5a5', fontSize: '0.85rem', margin: 0, padding: '0.5rem 0.75rem', background: '#450a0a', borderRadius: '0.375rem', border: '1px solid #b91c1c' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: '0.5rem', padding: '0.75rem', background: loading ? '#1e3a8a' : '#2563eb', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#475569' }}>
          Not an admin?{' '}
          <a href="/login" style={{ color: '#4169e1', fontWeight: 600, textDecoration: 'none' }}>Go to user login</a>
        </p>
      </section>
    </main>
  )
}

export default AdminLoginPage
