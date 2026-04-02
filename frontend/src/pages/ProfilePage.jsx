import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, KeyRound, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import api from '../services/api'

function ProfilePage({ user, role }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdSuccess, setPwdSuccess] = useState('')
  const [pwdError, setPwdError] = useState('')

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwdError('')
    setPwdSuccess('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdError('All fields are required.'); return
    }
    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters.'); return
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.'); return
    }

    setPwdLoading(true)
    try {
      await api.changePassword({ currentPassword, newPassword })
      setPwdSuccess('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwdError(err?.data?.message || 'Failed to update password. Please check your current password.')
    } finally {
      setPwdLoading(false)
    }
  }

  const roleLabel = role === 'admin' ? 'Administrator' : role === 'custodian' ? 'Facilities Manager' : role === 'faculty' ? 'Faculty Member' : 'Student Member'

  return (
    <div className="max-w-3xl mx-auto px-6 pb-32 pt-8 w-full">
      {/* Header */}
      <div className="mb-10">
        <p className="text-primary text-xs uppercase tracking-widest font-bold mb-2">Account</p>
        <h1 className="font-headline text-4xl md:text-5xl text-white mb-3">Profile</h1>
        <p className="text-slate-400 font-light">Manage your account settings and security preferences.</p>
      </div>

      {/* Identity card */}
      <div className="glass-panel rim-light rounded-2xl p-8 border border-white/5 mb-6">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/20 flex items-center justify-center flex-shrink-0">
            <User size={28} className="text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-white font-headline text-2xl">{user || 'User'}</h2>
            <p className="text-primary text-xs uppercase tracking-widest font-bold mt-1">{roleLabel}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold tracking-widest uppercase text-slate-500 block mb-2">Display Name</label>
            <div className="relative">
              <input
                readOnly
                value={user || ''}
                className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm outline-none cursor-not-allowed"
              />
              <Lock size={13} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" />
            </div>
            <p className="text-slate-600 text-xs mt-1.5">Contact an administrator to update your name.</p>
          </div>

          <div>
            <label className="text-xs font-bold tracking-widest uppercase text-slate-500 block mb-2">Role</label>
            <div className="flex items-center gap-3 px-4 py-3.5 bg-white/3 border border-white/10 rounded-xl">
              <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold ${
                role === 'admin' ? 'bg-blue-500/20 text-blue-400' :
                role === 'custodian' ? 'bg-indigo-500/20 text-indigo-400' :
                role === 'faculty' ? 'bg-emerald-500/20 text-emerald-400' :
                'bg-slate-500/20 text-slate-400'
              }`}>
                {role || 'student'}
              </span>
              <span className="text-slate-500 text-sm">{roleLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change password card */}
      <div className="glass-panel rim-light rounded-2xl p-8 border border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <KeyRound size={18} className="text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-white font-semibold">Change Password</h2>
            <p className="text-slate-500 text-xs mt-0.5">Update your login credentials securely.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="text-xs font-bold tracking-widest uppercase text-slate-500 block mb-2">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 text-sm focus:border-primary/50 focus:bg-primary/5 outline-none transition-all"
            />
          </div>
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
            <label className="text-xs font-bold tracking-widest uppercase text-slate-500 block mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 text-sm focus:border-primary/50 focus:bg-primary/5 outline-none transition-all"
            />
          </div>

          {pwdError && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
              <AlertCircle size={15} className="flex-shrink-0" />
              {pwdError}
            </div>
          )}
          {pwdSuccess && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm">
              <CheckCircle2 size={15} className="flex-shrink-0" />
              {pwdSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={pwdLoading}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              pwdLoading
                ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/10'
                : 'bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 shadow-[0_0_20px_rgba(77,142,255,0.1)]'
            }`}
          >
            {pwdLoading ? <><Loader2 size={16} className="animate-spin" /> Updating…</> : 'Update Password'}
          </button>

          <p className="text-center text-slate-500 text-xs mt-4">
            Forgot your password?{' '}
            <Link to="/forgot-password" className="text-primary hover:text-primary/80 font-semibold transition-colors">
              Reset it here
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default ProfilePage
