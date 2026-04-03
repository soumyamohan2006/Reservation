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
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
        <section style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '0.75rem', padding: '2.5rem 2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            
            <h1 style={{ color: '#1e293b', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Custodian Portal</h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.4rem' }}>Sign in with your custodian account</p>
          </div>

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#475569', fontSize: '0.875rem', fontWeight: 600 }}>
              Email
              <input
                type="email"
                placeholder="custodian@campus.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ padding: '0.65rem 0.9rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0.5rem', color: '#0f172a', fontSize: '0.95rem', outline: 'none' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#475569', fontSize: '0.875rem', fontWeight: 600 }}>
              Password
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ padding: '0.65rem 0.9rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0.5rem', color: '#0f172a', fontSize: '0.95rem', outline: 'none' }}
              />
            </label>

            {error && (
              <p style={{ color: '#b91c1c', fontSize: '0.85rem', margin: 0, padding: '0.5rem 0.75rem', background: '#fee2e2', borderRadius: '0.375rem', border: '1px solid #fca5a5' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: '0.5rem', padding: '0.75rem', background: loading ? '#60a5fa' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
            Admin?{' '}
            <a href="/admin-login" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>Go to Admin login</a>
            {' · '}
            <a href="/login" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>User login</a>
          </p>
        </section>
      </div>
    </main>
  )
}
