import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_URL } from '../config'

function RegisterPage({ setUser, setToken, setAppRole }) {
  const navigate = useNavigate()
  const [role, setRole] = useState('')
  const [roleLabel, setRoleLabel] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (event) => {
    event.preventDefault()
    if (!role) { setError('Please select a role.'); return }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      localStorage.setItem('user', data.name)
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)
      setUser(data.name)
      setToken(data.token)
      setAppRole(data.role)
      navigate('/')
    } catch {
      setError('Server error. Is the backend running?')
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <h1 className="login-title">Register</h1>
        <p className="login-subtitle">Create an account to start booking spaces.</p>

        <form className="login-form" onSubmit={onSubmit}>
          <label className="form-field">
            Role
            <div className="role-toggle">
              {[{ label: 'Faculty', value: 'faculty' }, { label: 'Student', value: 'student' }].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`role-btn ${roleLabel === item.label ? 'role-btn-active' : ''}`}
                  onClick={() => { setRole(item.value); setRoleLabel(item.label) }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </label>

          <label className="form-field">
            Full Name
            <input type="text" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label className="form-field">
            Email
            <input type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>

          <label className="form-field">
            Password
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

          {error && <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>}

          <button type="submit" className="btn btn-primary login-submit">
            Register
          </button>
        </form>

        <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#4169e1', fontWeight: 600 }}>Login</Link>
        </p>
      </section>
    </main>
  )
}

export default RegisterPage
