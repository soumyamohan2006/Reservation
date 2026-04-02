import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, MapPin, Search, Headset, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import api from '../services/api'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Button } from '../components/ui/button'

function MyBookingsPage({ token }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)
  const [cancelConfirm, setCancelConfirm] = useState(null)
  const [cancelError, setCancelError] = useState('')
  const [cancelSuccess, setCancelSuccess] = useState('')

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    
    api.getMyBookings()
      .then(data => {
        setBookings(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [token])

  const defaultImage = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2669&ixlib=rb-4.0.3"

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })
  }

  const onCancelClick = (booking) => {
    setCancelError('')
    setCancelSuccess('')
    setCancelConfirm(booking)
  }

  const onConfirmCancel = async () => {
    if (!cancelConfirm) return
    setCancellingId(cancelConfirm._id)
    try {
      await api.cancelBooking(cancelConfirm._id)
      setCancelSuccess(`Booking for ${cancelConfirm.hallId?.name} has been cancelled.`)
      setBookings(bookings.filter(b => b._id !== cancelConfirm._id))
      setCancelConfirm(null)
    } catch (err) {
      setCancelError(err?.data?.message || 'Failed to cancel booking.')
    } finally {
      setCancellingId(null)
    }
  }

  const canCancelBooking = (booking) => {
    return booking.status === 'Pending' || booking.status === 'Approved'
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
                    src={booking.hallId?.imageUrl || booking.hallId?.image || defaultImage}
                  />
                </div>
                
                <div className="flex-grow">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold ${
                      booking.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' : 
                      booking.status === 'Rejected' ? 'bg-red-500/20 text-red-400' :
                      booking.status === 'Cancelled' ? 'bg-slate-500/20 text-slate-400' :
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
                      {booking.slotId?.date ? formatDate(booking.slotId.date) : 'Date unavailable'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      {booking.slotId?.timeSlot || 'Time unavailable'}
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
                  <Link
                    to={booking.hallId?._id ? `/halls/${booking.hallId._id}` : '/'}
                    className="flex-1 lg:w-48 py-3 rounded-xl bg-surface-container-highest border border-white/10 text-white text-sm font-medium hover:bg-surface-bright transition-all text-center"
                  >
                    View Space
                  </Link>
                  <button
                    onClick={() => onCancelClick(booking)}
                    disabled={!canCancelBooking(booking) || cancellingId === booking._id}
                    title={!canCancelBooking(booking) ? 'Cannot cancel this booking' : 'Cancel this booking'}
                    className={`flex-1 lg:w-48 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      canCancelBooking(booking)
                        ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer'
                        : 'border-white/10 text-slate-500 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {cancellingId === booking._id ? (
                      <><Loader2 size={16} className="animate-spin" /> Cancelling…</>
                    ) : (
                      'Cancel Booking'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cancellation Confirmation Dialog */}
      <Dialog open={!!cancelConfirm} onOpenChange={(open) => !open && setCancelConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {cancelConfirm && (
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/3 p-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Hall</span>
                <span className="text-white font-medium">{cancelConfirm.hallId?.name || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Date</span>
                <span className="text-white font-medium">{cancelConfirm.slotId?.date ? formatDate(cancelConfirm.slotId.date) : '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Time Slot</span>
                <span className="text-white font-medium">{cancelConfirm.slotId?.timeSlot || '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Status</span>
                <span className={`font-medium ${
                  cancelConfirm.status === 'Approved' ? 'text-emerald-400' : 
                  cancelConfirm.status === 'Rejected' ? 'text-red-400' :
                  'text-amber-400'
                }`}>{cancelConfirm.status}</span>
              </div>
            </div>
          )}

          {cancelError && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
              <AlertCircle size={15} className="flex-shrink-0" />
              {cancelError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelConfirm(null)} disabled={cancellingId}>
              Keep Booking
            </Button>
            <Button onClick={onConfirmCancel} disabled={cancellingId} variant="destructive">
              {cancellingId ? <><Loader2 size={16} className="animate-spin" /> Cancelling…</> : 'Cancel Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
