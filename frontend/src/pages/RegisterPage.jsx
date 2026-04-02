import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, User, ShieldCheck, ArrowRight } from 'lucide-react'
import api from '../services/api'

function RegisterPage({ setUser, setToken, setAppRole }) {
  const navigate = useNavigate()
  const [role, setRole] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    if (!role) { setError('Please select your organizational role.'); return }
    if (password !== confirm) {
      setError('Passphrases do not match.')
      return
    }
    setLoading(true)
    try {
      const data = await api.register({ name, email, password, role })
      localStorage.setItem('user', data.name)
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)
      setUser(data.name)
      setToken(data.token)
      setAppRole(data.role)
      navigate('/')
    } catch (err) {
      setError(err?.data?.message || 'Server connection failed. Please ensure you are connected to the network.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col w-full px-6 flex-grow items-center justify-center min-h-[80vh] py-12">
      
      {/* Decorative localized glow just for auth page */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-tertiary-container/5 rounded-full blur-[150px] pointer-events-none z-0"></div>

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-10">
          <h1 className="font-headline text-5xl text-white mb-3 tracking-tight">Request Access</h1>
          <p className="text-slate-400 font-light">Join the Obsidian Reserve network to secure premium spaces.</p>
        </div>

        <div className="glass-panel rim-light rounded-[2rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden">
          <form className="space-y-6" onSubmit={onSubmit}>
            
            <div className="space-y-3">
              <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-500 ml-1">Affiliation</label>
              <div className="flex bg-surface-container-lowest/50 p-1.5 rounded-2xl border border-white/10 gap-2">
                {[
                  { label: 'Faculty', value: 'faculty' }, 
                  { label: 'Student', value: 'student' }
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={`flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all duration-300 ${
                      role === item.value 
                        ? 'bg-surface-container-highest text-white shadow-lg' 
                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => setRole(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 relative">
              <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-500 ml-1">Full Legal Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder="Julian Vane" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-xl py-4 pl-12 pr-5 text-white focus:ring-2 focus:ring-primary/50 transition-all outline-none placeholder:text-slate-600 font-light"
                />
              </div>
            </div>

            <div className="space-y-2 relative">
              <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-500 ml-1">Corporate Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  placeholder="executive@company.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-xl py-4 pl-12 pr-5 text-white focus:ring-2 focus:ring-primary/50 transition-all outline-none placeholder:text-slate-600 font-light"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 relative">
                <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-500 ml-1">Passphrase</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-xl py-4 pl-12 pr-10 text-white focus:ring-2 focus:ring-primary/50 transition-all outline-none placeholder:text-slate-600 font-light tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 relative">
                <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-500 ml-1">Confirm</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <ShieldCheck size={18} />
                  </div>
                  <input 
                    type={showConfirm ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    value={confirm} 
                    onChange={(e) => setConfirm(e.target.value)} 
                    required 
                    className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-xl py-4 pl-12 pr-10 text-white focus:ring-2 focus:ring-primary/50 transition-all outline-none placeholder:text-slate-600 font-light tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors focus:outline-none"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
                <div className="text-red-400 mt-0.5">⚠️</div>
                <p className="text-sm text-red-200 font-light">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-on-primary-fixed py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_25px_rgba(173,198,255,0.4)] hover:brightness-110 active:scale-95 duration-300 mt-6 disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-on-primary-fixed border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Submit Application <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already a certified member?{' '}
          <Link to="/login" className="font-bold text-primary hover:text-white transition-colors border-b border-primary/30 hover:border-white pb-0.5">
            Access Dashboard
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
