import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { KeyRound, AlertCircle, CheckCircle2, Loader2, ChevronLeft } from 'lucide-react'
import api from '../services/api'

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid password reset link. Please request a new one.')
    }
  }, [token, email])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!token || !email) {
      setError('Invalid reset link. Please request a new password reset.')
      return
    }

    setLoading(true)
    try {
      await api.resetPassword({
        token,
        email,
        newPassword
      })
      setSuccess('Password has been reset successfully! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err?.data?.message || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Back link */}
      <Link to="/login" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-12 transition-colors group self-start">
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to login
      </Link>

      <div className="glass-panel rim-light rounded-2xl p-8 border border-white/5 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <KeyRound size={24} className="text-primary" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-center font-headline text-3xl text-white mb-2">Reset Password</h1>
        <p className="text-center text-slate-400 text-sm mb-8">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-bold tracking-widest uppercase text-slate-500 block mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 text-sm focus:border-primary/50 focus:bg-primary/5 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold tracking-widest uppercase text-slate-500 block mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 text-sm focus:border-primary/50 focus:bg-primary/5 outline-none transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm">
              <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" />
              <div>{success}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success || !token || !email}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              loading || success || !token || !email
                ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/10'
                : 'bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 shadow-[0_0_20px_rgba(77,142,255,0.1)]'
            }`}
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Resetting…</> : 'Reset Password'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/10 text-center">
          <p className="text-slate-400 text-sm">
            <Link to="/forgot-password" className="text-primary hover:text-primary/80 font-semibold transition-colors">
              Request another reset link
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
