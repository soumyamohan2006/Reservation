import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { API_URL } from '../config'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) setError('Invalid or missing reset link.')
  }, [token])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!token) { setError('Invalid token.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); setLoading(false); return }
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch {
      setError('Server error. Please try again.')
      setLoading(false)
    }
  }

  const eyeBtn = {
    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
    background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8',
    padding: '0', display: 'flex', alignItems: 'center',
  }

  if (success) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h1 className="login-title" style={{ color: '#15803d' }}>Password Reset!</h1>
            <p className="login-subtitle">Redirecting you to login...</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <h1 className="login-title">Reset Password</h1>
        <p className="login-subtitle">Enter your new password below.</p>

        <form className="login-form" onSubmit={onSubmit}>
          <label className="form-field">
            New Password
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '40px' }}
                disabled={!token || loading}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeBtn}>
                {showPassword
                  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
          </label>

          <label className="form-field">
            Confirm Password
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ paddingRight: '40px' }}
                disabled={!token || loading}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={eyeBtn}>
                {showConfirm
                  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
          </label>

          {error && <p style={{ color: '#b91c1c', fontSize: '0.875rem' }}>{error}</p>}

          <button type="submit" className="btn btn-primary login-submit" disabled={!token || loading} style={{ opacity: (!token || loading) ? 0.6 : 1 }}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#64748b' }}>
          <Link to="/login" style={{ color: '#4169e1', fontWeight: 600 }}>Back to Login</Link>
        </p>
      </section>
    </main>
  )
}

export default ResetPasswordPage
