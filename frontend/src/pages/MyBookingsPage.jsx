import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, MapPin, Search, Headset } from 'lucide-react'
import api from '../services/api'

function MyBookingsPage({ user, token }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    
    api.getMyBookings()
      .then(data => {
        setBookings(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [token])

  const defaultImage = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2669&ixlib=rb-4.0.3"

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })
  }

  return (
    <div className="flex flex-col w-full px-6 max-w-7xl mx-auto pb-32 pt-12">
      {/* Header Section */}
      <header className="mb-16">
        <h1 className="text-5xl md:text-6xl font-headline font-light tracking-tight text-white mb-4">My Reservations</h1>
        <p className="text-slate-400 max-w-xl text-lg font-light leading-relaxed">
          Manage your upcoming retreats and historical access within the Obsidian Reserve ecosystem.
        </p>
      </header>

      {/* Tabs & Filter Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex p-1 bg-surface-container-low rounded-2xl w-fit border border-white/5">
          <button className="px-8 py-2.5 rounded-xl bg-surface-container-highest text-primary font-medium shadow-lg transition-all">Upcoming</button>
          <button className="px-8 py-2.5 rounded-xl text-slate-400 hover:text-white transition-colors">Past Bookings</button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 uppercase tracking-widest font-medium">Filter by</span>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 rounded-full border border-white/10 text-xs text-white bg-surface-container-low hover:bg-surface-container-high transition-colors">Workspace</button>
            <button className="px-4 py-1.5 rounded-full border border-white/10 text-xs text-white bg-surface-container-low hover:bg-surface-container-high transition-colors">Leisure</button>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="glass-panel rim-light py-20 flex flex-col items-center justify-center rounded-2xl border border-white/5">
            <Search size={48} className="text-slate-600 mb-4" strokeWidth={1} />
            <h3 className="text-2xl font-soria text-white mb-2">No active reservations</h3>
            <p className="text-slate-400 mb-6">You don't have any upcoming space bookings right now.</p>
            <Link to="/" className="px-8 py-3 rounded-full bg-primary text-on-primary-fixed font-bold">Discover Spaces</Link>
          </div>
        ) : (
          bookings.map((booking) => (
            <div key={booking._id} className="glass-panel rim-light group relative overflow-hidden rounded-2xl p-8 transition-all hover:bg-surface-container-high/50 hover:translate-y-[-2px] border border-white/5">
              <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                
                <div className="w-full lg:w-48 h-32 rounded-xl overflow-hidden flex-shrink-0">
                  <img 
                    alt={booking.hallId?.name || 'Space'} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    src={booking.hallId?.imageUrl || defaultImage}
                  />
                </div>
                
                <div className="flex-grow">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold ${
                      booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 
                      booking.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {booking.status}
                    </span>
                    <span className="text-slate-600 text-xs font-mono uppercase">REF-{booking._id.substring(0,6)}</span>
                  </div>
                  
                  <h3 className="text-2xl font-headline text-white mb-2">{booking.hallId?.name || 'Deleted Hall'}</h3>
                  
                  <div className="flex flex-wrap items-center gap-6 text-slate-400 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      {formatDate(booking.date)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      {booking.slot?.startTime} - {booking.slot?.endTime}
                    </div>
                    {booking.purpose && (
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        {booking.purpose}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex lg:flex-col gap-3 w-full lg:w-auto mt-4 lg:mt-0">
                  <button className="flex-1 lg:w-48 py-3 rounded-xl bg-surface-container-highest border border-white/10 text-white text-sm font-medium hover:bg-surface-bright transition-all">
                    Manage Details
                  </button>
                  <button className="flex-1 lg:w-48 py-3 rounded-xl border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-all">
                    Cancel Reservation
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Featured Concierge Support */}
      <section className="mt-24">
        <div className="glass-panel rim-light rounded-2xl p-10 flex flex-col md:flex-row items-center gap-10 border border-white/5">
          <div className="w-full md:w-1/3 aspect-square rounded-2xl overflow-hidden flex-shrink-0">
            <img 
              alt="Personal Concierge" 
              className="w-full h-full object-cover" 
              src="https://images.unsplash.com/photo-1556745753-b2904692b3cd?auto=format&fit=crop&q=80&w=1200&ixlib=rb-4.0.3"
            />
          </div>
          <div className="flex-grow">
            <h2 className="text-3xl font-headline text-white mb-4 italic">Need to make complex changes?</h2>
            <p className="text-slate-400 mb-8 leading-relaxed max-w-lg font-light">
              Our dedicated Platinum Concierge team is available 24/7 to handle adjustments to your travel, catering, or technical requirements for any reservation.
            </p>
            <button className="px-8 py-4 rounded-xl bg-primary text-on-primary-fixed font-semibold flex items-center gap-3 hover:shadow-[0_0_20px_rgba(77,142,255,0.4)] transition-all">
              <Headset size={20} />
              Contact Digital Concierge
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default MyBookingsPage
