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
  const [touched, setTouched] = useState({})
  const [fieldErrors, setFieldErrors] = useState({})

  const validate = (name, value) => {
    if (name === 'email') {
      if (!value) return 'Email is required'
      if (!/\S+@\S+\.\S+/.test(value)) return 'Enter a valid email'
    }
    if (name === 'password') {
      if (!value) return 'Password is required'
    }
    return ''
  }

  const onBlur = (name, value) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    setFieldErrors(prev => ({ ...prev, [name]: validate(name, value) }))
  }

  const onChange = (name, value) => {
    if (touched[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: validate(name, value) }))
    }
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    const errors = { email: validate('email', email), password: validate('password', password) }
    setFieldErrors(errors)
    setTouched({ email: true, password: true })
    if (errors.email || errors.password) return
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

  const inpStyle = (hasError) => ({ width: '100%', boxSizing: 'border-box', border: hasError ? '1px solid #ef4444' : '1px solid #cbd5e1', borderRadius: '0.5rem', background: '#ffffff', padding: '10px 12px', fontSize: '0.9rem', color: '#1e293b', outline: 'none' })
  const errStyle = { color: '#ef4444', fontSize: '0.78rem', marginTop: '4px' }

  return (
    <main className="login-page">
      <section className="login-card">
        <h1 className="login-title">Login</h1>
        <p className="login-subtitle">Enter your details below to access the bookings.</p>

        <form className="login-form" onSubmit={onSubmit} noValidate>
          <label className="form-field">
            Email
            <input
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); onChange('email', e.target.value) }}
              onBlur={(e) => onBlur('email', e.target.value)}
              style={inpStyle(touched.email && fieldErrors.email)}
            />
            {touched.email && fieldErrors.email && <span style={errStyle}>{fieldErrors.email}</span>}
          </label>

          <label className="form-field">
            Password
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); onChange('password', e.target.value) }}
                onBlur={(e) => onBlur('password', e.target.value)}
                style={{ ...inpStyle(touched.password && fieldErrors.password), paddingRight: '2.5rem' }}
              />
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
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showPassword
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
            {touched.password && fieldErrors.password && <span style={errStyle}>{fieldErrors.password}</span>}
          </label>

          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '0.375rem' }}>{error}</p>}

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
