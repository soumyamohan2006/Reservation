import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

function SetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing token.')
    }
  }, [token])

  const onSubmit = async (event) => {
    event.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    try {
      const res = await fetch('http://localhost:4000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch {
      setError('Server error. Please try again.')
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <h1 className="login-title">Set Your Password</h1>
        <p className="login-subtitle">Create a password to activate your custodian account.</p>

        {success ? (
          <div style={{ padding: '1rem', background: '#14532d', border: '1px solid #16a34a', borderRadius: '0.5rem', color: '#86efac', marginTop: '1rem' }}>
            ✅ Password set successfully! Redirecting to login...
          </div>
        ) : (
          <form className="login-form" onSubmit={onSubmit}>
            <label className="form-field">
              New Password
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ paddingRight: '40px' }} />
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

            <label className="form-field">
              Confirm Password
              <div style={{ position: 'relative' }}>
                <input type={showConfirm ? 'text' : 'password'} placeholder="Confirm your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required style={{ paddingRight: '40px' }} />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
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
                  {showConfirm ? '👁' : '🔒'}
                </button>
              </div>
            </label>

            {error && <p style={{ color: '#fca5a5', fontSize: '0.875rem' }}>{error}</p>}

            <button type="submit" className="btn btn-primary login-submit">
              Set Password
            </button>
          </form>
        )}
      </section>
    </main>
  )
}

export default SetPasswordPage
