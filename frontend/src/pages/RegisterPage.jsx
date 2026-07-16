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
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({})
  const [fieldErrors, setFieldErrors] = useState({})

  const validate = (fieldName, value) => {
    if (fieldName === 'name') {
      if (!value.trim()) return 'Full name is required'
      if (value.trim().length < 2) return 'Name must be at least 2 characters'
    }
    if (fieldName === 'email') {
      if (!value) return 'Email is required'
      if (!/\S+@\S+\.\S+/.test(value)) return 'Enter a valid email'
    }
    if (fieldName === 'password') {
      if (!value) return 'Password is required'
      if (value.length < 6) return 'Password must be at least 6 characters'
    }
    if (fieldName === 'confirm') {
      if (!value) return 'Please confirm your password'
      if (value !== password) return 'Passwords do not match'
    }
    return ''
  }

  const validateRole = () => {
    if (!role) return 'Please select a role'
    return ''
  }

  const onBlur = (fieldName, value) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
    setFieldErrors(prev => ({ ...prev, [fieldName]: validate(fieldName, value) }))
  }

  const onChange = (fieldName, value) => {
    if (touched[fieldName]) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: validate(fieldName, value) }))
    }
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    const roleError = validateRole()
    const errors = {
      name: validate('name', name),
      email: validate('email', email),
      password: validate('password', password),
      confirm: validate('confirm', confirm),
    }
    if (roleError) errors.role = roleError
    setFieldErrors(errors)
    setTouched({ name: true, email: true, password: true, confirm: true })
    if (roleError || errors.name || errors.email || errors.password || errors.confirm) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email, password, role }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      sessionStorage.setItem('user', data.name)
      sessionStorage.setItem('token', data.token)
      sessionStorage.setItem('role', data.role)
      setUser(data.name)
      setToken(data.token)
      setAppRole(data.role)
      navigate('/')
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
        <h1 className="login-title">Register</h1>
        <p className="login-subtitle">Create an account to start booking spaces.</p>

        <form className="login-form" onSubmit={onSubmit} noValidate>
          <label className="form-field">
            Role
            <div className="role-toggle">
              {[{ label: 'Faculty', value: 'faculty' }, { label: 'Student', value: 'student' }].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`role-btn ${roleLabel === item.label ? 'role-btn-active' : ''}`}
                  onClick={() => { setRole(item.value); setRoleLabel(item.label); setTouched(prev => ({ ...prev, role: true })); setFieldErrors(prev => ({ ...prev, role: '' })) }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {touched.role && fieldErrors.role && <span style={errStyle}>{fieldErrors.role}</span>}
          </label>

          <label className="form-field">
            Full Name
            <input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => { setName(e.target.value); onChange('name', e.target.value) }}
              onBlur={(e) => onBlur('name', e.target.value)}
              style={inpStyle(touched.name && fieldErrors.name)}
            />
            {touched.name && fieldErrors.name && <span style={errStyle}>{fieldErrors.name}</span>}
          </label>

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
                placeholder="Create a password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); onChange('password', e.target.value); if (touched.confirm) setFieldErrors(prev => ({ ...prev, confirm: validate('confirm', confirm) })) }}
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

          <label className="form-field">
            Confirm Password
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); onChange('confirm', e.target.value) }}
                onBlur={(e) => onBlur('confirm', e.target.value)}
                style={{ ...inpStyle(touched.confirm && fieldErrors.confirm), paddingRight: '2.5rem' }}
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
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showConfirm
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
            {touched.confirm && fieldErrors.confirm && <span style={errStyle}>{fieldErrors.confirm}</span>}
          </label>

          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '0.375rem' }}>{error}</p>}

          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? 'Please wait...' : 'Register'}
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
