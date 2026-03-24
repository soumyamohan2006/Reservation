import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'

function LoginPage({ setUser }) {
  const navigate = useNavigate()
  const { hallId } = useParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (event) => {
    event.preventDefault()
    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setUser(data.name)
      navigate(hallId ? `/spaces/${hallId}` : '/')
    } catch {
      setError('Server error. Is the backend running?')
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
            <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>

          {error && <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>}

          <button type="submit" className="btn btn-primary login-submit">
            Login
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
