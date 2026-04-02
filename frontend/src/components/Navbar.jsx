import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, LogOut } from 'lucide-react'

const Navbar = () => {
  const navigate = useNavigate()
  // Mock auth state for UI skeleton. This will be replaced by your actual auth check.
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    navigate('/login')
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface-variant/40 backdrop-blur-2xl border-b border-white/10 shadow-2xl flex justify-between items-center px-8 h-20">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-2xl font-newsreader italic text-white tracking-tight">
          Obsidian Spaces
        </Link>
        <div className="hidden md:flex items-center gap-6 ml-8">
          <Link to="/" className="text-blue-300 font-bold border-b border-blue-300 transition-colors font-body text-sm tracking-wide">Spaces</Link>
          <a href="#amenities" className="text-slate-400 hover:text-white transition-colors font-body text-sm tracking-wide">Amenities</a>
          <a href="#process" className="text-slate-400 hover:text-white transition-colors font-body text-sm tracking-wide">Process</a>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {token ? (
          <>
             {(role === 'admin' || role === 'custodian') && (
               <Link to={`/${role}`} className="text-slate-400 hover:text-white text-sm font-body px-2">Dashboard</Link>
             )}
             <Link to="/bookings" className="text-slate-400 hover:text-white text-sm font-body px-2">My Bookings</Link>
             <div className="h-6 w-[1px] bg-white/20 mx-2"></div>
             
             <button onClick={handleLogout} className="text-slate-400 hover:text-white p-2 rounded-full transition-colors flex items-center justify-center">
               <LogOut size={20} />
             </button>
             <Link to="/profile" className="bg-primary/20 text-primary p-2 flex items-center justify-center rounded-full hover:bg-primary/30 transition-colors">
               <User size={20} />
             </Link>
          </>
        ) : (
          <>
            <Link to="/login" className="text-slate-300 hover:text-white text-sm tracking-wide font-bold px-4 py-2 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-xl font-bold transition-all hover:brightness-110 active:scale-95 duration-300">
              Book Now
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
