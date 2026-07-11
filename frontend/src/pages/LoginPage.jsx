import { useState } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import { API_URL } from '../config'

function LoginPage({ setUser, setToken, setRole }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { hallId } = useParams()
  const from = location.state?.from || (hallId ? `/reserve/${hallId}` : '/')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      sessionStorage.setItem('user', data.name)
      sessionStorage.setItem('token', data.token)
      sessionStorage.setItem('role', data.role)
      setUser(data.name)
      setToken(data.token)
      setRole(data.role)
      navigate(data.role === 'admin' ? '/admin' : data.role === 'custodian' ? '/custodian' : from)
    } catch {
      setError('Server error. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <h1 className="login-title">Login</h1>
        <p className="login-subtitle">Enter your details below to access the bookings.</p>

        <form className="login-form" onSubmit={onSubmit}>
          <label className="form-field">
            Email
            <input type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>

          <label className="form-field">
            Password
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ paddingRight: '40px' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  fontSize: '1.2rem',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                                {showPassword
                  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
          </label>

          {error && <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>}

          <p style={{ textAlign: 'left', fontSize: '0.85rem', marginTop: '-0.25rem', marginBottom: '0.5rem' }}>
            <Link to="/forgot-password" style={{ color: '#4169e1', fontWeight: 500, textDecoration: 'none' }}>Forgot password?</Link>
          </p>

          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? 'Please wait...' : 'Login'}
          </button>
        </form>

        <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#4169e1', fontWeight: 600 }}>Register</Link>
        </p>
      </section>
    </main>
  )
}

export default LoginPage
