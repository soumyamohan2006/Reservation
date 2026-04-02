import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { User, LogOut, Search, X, ChevronDown, LayoutDashboard, CalendarCheck, Settings } from 'lucide-react'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  const userName = localStorage.getItem('user')

  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const dropdownRef = useRef(null)
  const searchRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close dropdown when route changes
  useEffect(() => {
    setDropdownOpen(false)
    setSearchOpen(false)
    setSearchQuery('')
  }, [location.pathname])

  // Subtle scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user')
    setDropdownOpen(false)
    navigate('/login')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const dashboardPath = role === 'admin' ? '/admin' : role === 'custodian' ? '/custodian' : null

  const navLinks = [
    { label: 'Spaces', href: '/' },
    { label: 'My Bookings', href: '/bookings', requireAuth: true },
  ]

  return (
    <nav className={`fixed top-0 w-full z-50 flex items-center justify-between px-6 md:px-10 h-20 transition-all duration-300 ${
      scrolled 
        ? 'bg-[#0e0e10]/90 backdrop-blur-2xl border-b border-white/10 shadow-2xl shadow-black/50' 
        : 'bg-surface-variant/40 backdrop-blur-2xl border-b border-white/10'
    }`}>

      {/* Left — Brand */}
      <div className="flex items-center gap-8 flex-shrink-0">
        <Link to="/" className="text-xl md:text-2xl font-newsreader italic text-white tracking-tight hover:text-primary transition-colors duration-200">
          Obsidian Spaces
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => {
            if (link.requireAuth && !token) return null
            const isActive = location.pathname === link.href
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          {dashboardPath && (
            <Link
              to={dashboardPath}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === dashboardPath
                  ? 'text-primary bg-primary/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* Center — Search bar (desktop) */}
      <div className="hidden md:flex flex-1 justify-center max-w-sm mx-8">
        <form onSubmit={handleSearch} className="relative w-full">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 hover:border-white/20 focus-within:border-primary/50 focus-within:bg-primary/5 transition-all duration-200 group">
            <Search size={15} className="text-slate-500 group-focus-within:text-primary transition-colors flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search spaces…"
              className="bg-transparent text-white text-sm flex-1 outline-none placeholder:text-slate-600 min-w-0"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-white transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right — Auth actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Mobile search toggle */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Search"
        >
          <Search size={20} />
        </button>

        {token ? (
          <div className="flex items-center gap-2">
            {/* User dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 group"
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                  <User size={14} className="text-primary" />
                </div>
                <span className="hidden md:block text-sm text-white font-medium max-w-[100px] truncate">
                  {userName || 'Account'}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown panel */}
              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 py-2 bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden">
                  {/* User identity */}
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-white text-sm font-semibold truncate">{userName || 'User'}</p>
                    <p className="text-xs text-slate-500 capitalize mt-0.5 tracking-wide">{role || 'Member'}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Settings size={15} className="text-slate-500" />
                      Profile Settings
                    </Link>
                    <Link
                      to="/bookings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <CalendarCheck size={15} className="text-slate-500" />
                      My Bookings
                    </Link>
                    {dashboardPath && (
                      <Link
                        to={dashboardPath}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <LayoutDashboard size={15} className="text-slate-500" />
                        Dashboard
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-white/5 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden md:block text-sm text-slate-300 hover:text-white font-medium px-4 py-2 transition-colors">
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-primary/20 border border-primary/30 text-primary px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/30 active:scale-95 transition-all duration-200"
            >
              Book Now
            </Link>
          </div>
        )}
      </div>

      {/* Mobile search bar — slides down */}
      {searchOpen && (
        <div ref={searchRef} className="absolute top-full left-0 right-0 md:hidden px-4 py-3 bg-[#0e0e10]/95 backdrop-blur-xl border-b border-white/10 shadow-xl">
          <form onSubmit={handleSearch} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <Search size={16} className="text-slate-500 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search spaces…"
              autoFocus
              className="bg-transparent text-white text-sm flex-1 outline-none placeholder:text-slate-600"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="text-slate-500">
                <X size={14} />
              </button>
            )}
          </form>
        </div>
      )}
    </nav>
  )
}

export default Navbar
