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
      localStorage.setItem('user', data.name)
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)
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
                {showPassword ? '👁' : '🔒'}
              </button>
            </div>
          </label>

          {error && <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>}

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
