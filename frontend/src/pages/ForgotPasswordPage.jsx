import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, AlertCircle, CheckCircle2, Loader2, ChevronLeft } from 'lucide-react'
import api from '../services/api'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email) {
      setError('Please enter your email address.')
      return
    }

    setLoading(true)
    try {
      await api.forgotPassword(email)
      setSuccess('Password reset link has been sent to your email. Please check your inbox.')
      setEmail('')
    } catch (err) {
      setError(err?.data?.message || 'Failed to send reset link. Please try again.')
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
            <Mail size={24} className="text-primary" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-center font-headline text-3xl text-white mb-2">Forgot Password?</h1>
        <p className="text-center text-slate-400 text-sm mb-8">
          Enter your email and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-bold tracking-widest uppercase text-slate-500 block mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@example.com"
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
            disabled={loading || success}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              loading || success
                ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/10'
                : 'bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 shadow-[0_0_20px_rgba(77,142,255,0.1)]'
            }`}
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/10 text-center">
          <p className="text-slate-400 text-sm">
            Remembered your password?{' '}
            <Link to="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
