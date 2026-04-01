import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_URL } from '../config'

function SetPasswordPage() {
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
    if (!token) {
      setError('Invalid or missing token. Please use the link from your email.')
    }
  }, [token])

  const onSubmit = async (event) => {
    event.preventDefault()
    
    if (!token) {
      setError('Invalid token.')
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch(`${API_URL}/api/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.message || 'Failed to set password.')
        setLoading(false)
        return
      }
      
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch {
      setError('Server error. Please try again later.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h1 className="login-title" style={{ color: '#15803d' }}>Password Set Successfully!</h1>
            <p className="login-subtitle">Redirecting you to login page...</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <h1 className="login-title">Set Your Password</h1>
        <p className="login-subtitle">Create a secure password for your custodian account.</p>

        <form className="login-form" onSubmit={onSubmit}>
          <label className="form-field">
            New Password
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Enter your password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                style={{ paddingRight: '40px' }}
                disabled={!token || loading}
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
              <input 
                type={showConfirm ? 'text' : 'password'} 
                placeholder="Confirm your password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                style={{ paddingRight: '40px' }}
                disabled={!token || loading}
              />
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

          {error && (
            <div style={{ 
              padding: '0.75rem', 
              background: '#fee2e2', 
              border: '1px solid #b91c1c', 
              borderRadius: '0.5rem', 
              color: '#b91c1c', 
              fontSize: '0.875rem' 
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary login-submit"
            disabled={!token || loading}
            style={{ opacity: (!token || loading) ? 0.6 : 1 }}
          >
            {loading ? 'Setting Password...' : 'Set Password'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>
          After setting your password, you can login with your email and new password.
        </p>
      </section>
    </main>
  )
}

export default SetPasswordPage
