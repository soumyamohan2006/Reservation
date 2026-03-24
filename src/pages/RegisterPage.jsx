import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function RegisterPage({ setUser }) {
  const navigate = useNavigate()
  const [role, setRole] = useState('user')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (event) => {
    event.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    try {
      const res = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setUser(data.name)
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
              {[{ label: 'Custodian', value: 'custodian' }, { label: 'Faculty', value: 'user' }, { label: 'Students', value: 'user' }].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`role-btn ${role === item.value ? 'role-btn-active' : ''}`}
                  onClick={() => setRole(item.value)}
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
            <input type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>

          <label className="form-field">
            Confirm Password
            <input type="password" placeholder="Confirm your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
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
