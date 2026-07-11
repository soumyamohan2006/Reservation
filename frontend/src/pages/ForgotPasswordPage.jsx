import { useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../config'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Email is required.'); return }
    setLoading(true)
    setError('')
    setMsg('')
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) setMsg(data.message)
      else setError(data.message)
    } catch {
      setError('Server error. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <h1 className="login-title">Forgot Password</h1>
        <p className="login-subtitle">Enter your email and we'll send you a reset link.</p>

        <form className="login-form" onSubmit={onSubmit}>
          <label className="form-field">
            Email
            <input type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>

          {error && <p style={{ color: '#b91c1c', fontSize: '0.875rem' }}>{error}</p>}
          {msg && <p style={{ color: '#15803d', fontSize: '0.875rem' }}>{msg}</p>}

          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#64748b' }}>
          <Link to="/login" style={{ color: '#4169e1', fontWeight: 600 }}>Back to Login</Link>
        </p>
      </section>
    </main>
  )
}

export default ForgotPasswordPage
