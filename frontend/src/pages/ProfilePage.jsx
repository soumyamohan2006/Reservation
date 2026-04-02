import React, { useState } from 'react'
import { User, Shield, Bell, CreditCard, ArrowRight, Lock, KeyRound, Globe, Trash2 } from 'lucide-react'

function ProfilePage({ user, role }) {
  // Use placeholder image if none exists
  const defaultImage = "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400&ixlib=rb-4.0.3"

  const [activeTab, setActiveTab] = useState('personal')

  return (
    <div className="flex flex-col w-full px-6 md:px-12 max-w-6xl mx-auto pb-32 pt-12 relative">
      <header className="mb-16">
        <h1 className="font-headline text-5xl md:text-6xl text-white mb-4 tracking-tight">Account Settings</h1>
        <p className="text-slate-400 max-w-xl text-lg leading-relaxed font-light">
          Manage your executive preferences and secure your profile. Your information is encrypted and handled by your dedicated concierge team.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Side Navigation / Information */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="p-8 rounded-xl bg-surface-container-low border border-white/5 shadow-xl shadow-black/20">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20">
                <img alt="User Profile" className="w-full h-full object-cover" src={defaultImage} />
              </div>
              <div>
                <p className="font-headline text-2xl text-white">{user || 'Guest User'}</p>
                <p className="text-[10px] tracking-widest uppercase text-primary font-bold">{role === 'admin' ? 'Administrator' : role === 'custodian' ? 'Facilities Manager' : 'Private Member'}</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              <button 
                onClick={() => setActiveTab('personal')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 font-medium ${activeTab === 'personal' ? 'bg-surface-container-highest text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <User size={18} />
                <span className="text-sm">Personal Information</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 font-medium ${activeTab === 'security' ? 'bg-surface-container-highest text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Shield size={18} />
                <span className="text-sm">Security & Access</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('preferences')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 font-medium ${activeTab === 'preferences' ? 'bg-surface-container-highest text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Bell size={18} />
                <span className="text-sm">Preferences</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('billing')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 font-medium ${activeTab === 'billing' ? 'bg-surface-container-highest text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <CreditCard size={18} />
                <span className="text-sm">Billing Details</span>
              </button>
            </nav>
          </div>
          
          <div className="p-8 rounded-xl glass-panel rim-light space-y-4 border border-white/5">
            <h3 className="text-primary font-headline text-2xl italic">Concierge Support</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-light">Need assistance updating your legal documentation or corporate entity details?</p>
            <button className="text-white text-xs font-bold tracking-widest uppercase flex items-center space-x-2 group hover:text-primary transition-colors pt-2">
              <span>Contact Agent</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </aside>

        {/* Main Form Canvas */}
        <div className="lg:col-span-8 space-y-8">
          <div className="glass-panel rim-light rounded-2xl overflow-hidden shadow-2xl border border-white/5">
            <div className="p-10 space-y-12">
              
              {/* Personal Details Form Section */}
              <div className="space-y-6">
                <h2 className="font-headline text-3xl text-white">Personal Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-500 ml-1">Account Owner</label>
                    <input 
                      readOnly 
                      className="w-full bg-surface-container-lowest border border-white/5 rounded-xl py-4 px-5 text-white focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                      type="text" 
                      value={user || ''} 
                    />
                    <Lock size={14} className="absolute right-5 bottom-4 text-slate-600" />
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-500 ml-1">Email Address</label>
                    <input 
                      className="w-full bg-surface-container-low border border-white/5 rounded-xl py-4 px-5 text-white focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                      type="email" 
                      defaultValue={`${user || 'guest'}@obsidianspaces.com`} 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-500 ml-1">Phone Number</label>
                    <input 
                      className="w-full bg-surface-container-low border border-white/5 rounded-xl py-4 px-5 text-white focus:ring-2 focus:ring-primary/50 transition-all outline-none placeholder:text-slate-600" 
                      type="tel" 
                      placeholder="+1 (555) 000-0000" 
                    />
                  </div>
                </div>
              </div>
              
              <div className="h-px bg-white/5 w-full"></div>
              
              {/* Security Section */}
              <div className="space-y-6">
                <h2 className="font-headline text-3xl text-white">Security</h2>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-xl bg-surface-container-lowest/50 border border-white/5">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                      <KeyRound size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">Access Password</p>
                      <p className="text-xs text-slate-500 mt-1 font-light">Last changed during account creation</p>
                    </div>
                  </div>
                  <button className="px-6 py-2.5 rounded-full border border-white/10 text-sm font-bold hover:bg-white/5 transition-all duration-300 text-white">
                    Change Password
                  </button>
                </div>
              </div>
            </div>
            
            {/* Action Footer */}
            <div className="px-10 py-8 bg-surface-container flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5">
              <p className="text-xs text-slate-500 italic max-w-sm">Changes made here will be synchronized across all Obsidian platforms.</p>
              <div className="flex items-center space-x-4 w-full md:w-auto">
                <button className="w-full md:w-auto px-8 py-3 bg-primary text-on-primary-fixed font-bold rounded-full text-sm hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(173,198,255,0.2)]">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
          
          {/* Footer Meta */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Identity Verified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe size={14} className="text-slate-500" />
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Current Node: Secure</span>
              </div>
            </div>
            
            <button className="text-xs text-red-400/80 hover:text-red-400 transition-colors flex items-center space-x-1 group">
              <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
              <span className="font-bold uppercase tracking-wider">Deactivate Account</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ProfilePage
