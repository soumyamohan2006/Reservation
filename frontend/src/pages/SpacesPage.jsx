import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, Clock, ChevronLeft, BookOpen, Loader2 } from 'lucide-react'
import api from '../services/api'

function SpacesPage({ halls }) {
  const { hallId } = useParams()
  const hall = halls.find(h => h.id === hallId || h._id === hallId)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!hallId) return
    setLoading(true)
    api.getGlobalBookings(hallId)
      .then(data => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [hallId])

  const groupedByDate = bookings.reduce((acc, b) => {
    const date = b.slotId?.date
    const slot = b.slotId?.timeSlot
    if (!date || !slot) return acc
    if (!acc[date]) acc[date] = []
    acc[date].push(slot)
    return acc
  }, {})

  const sortedDates = Object.keys(groupedByDate).sort()

  if (!hallId) {
    return (
      <div className="max-w-4xl mx-auto px-6 pb-32 pt-8 w-full">
        <div className="mb-8">
          <p className="text-primary text-xs uppercase tracking-widest font-bold mb-2">Availability</p>
          <h1 className="font-headline text-4xl text-white mb-3">Select a Space</h1>
          <p className="text-slate-400 font-light">Choose a space below to view its booking availability.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {halls.map(h => (
            <Link
              key={h._id || h.id}
              to={`/spaces/${h._id || h.id}`}
              className="glass-panel rim-light rounded-2xl p-6 border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all group"
            >
              <h2 className="text-white font-semibold text-lg group-hover:text-primary transition-colors">{h.name}</h2>
              <p className="text-slate-500 text-sm mt-1">Capacity: {h.capacity || '—'}</p>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 pb-32 pt-8 w-full">
      {/* Back link */}
      <Link
        to="/"
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors group w-fit"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to spaces
      </Link>

      {/* Header */}
      <div className="mb-8">
        <p className="text-primary text-xs uppercase tracking-widest font-bold mb-2">Availability Calendar</p>
        <h1 className="font-headline text-4xl md:text-5xl text-white mb-3">
          {hall ? hall.name : 'Space'}
        </h1>
        {hall && (
          <p className="text-slate-400 font-light">
            Capacity: {hall.capacity || '—'}
          </p>
        )}
        {!hall && (
          <p className="text-red-400 text-sm mt-2">This space could not be found. It may have been removed.</p>
        )}
      </div>

      {hall && (
        <>
          {/* Book CTA */}
          <div className="glass-panel rim-light rounded-2xl p-6 border border-white/5 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen size={18} className="text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Ready to reserve this space?</p>
                <p className="text-slate-500 text-xs mt-0.5">Submit a booking request in seconds.</p>
              </div>
            </div>
            <Link
              to={`/book/${hall._id || hall.id}`}
              className="px-6 py-2.5 rounded-xl bg-primary/20 border border-primary/30 text-primary text-sm font-bold hover:bg-primary/30 transition-all whitespace-nowrap"
            >
              Book Now
            </Link>
          </div>

          {/* Calendar section */}
          <div className="glass-panel rim-light rounded-2xl p-8 border border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <CalendarDays size={20} className="text-primary" strokeWidth={1.5} />
              <h2 className="text-white font-semibold text-sm uppercase tracking-widest opacity-70">
                Booked Slots
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={28} className="animate-spin text-primary/50" />
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Clock size={36} className="text-slate-700" strokeWidth={1} />
                <p className="text-slate-400 text-sm">No bookings recorded for this space.</p>
                <p className="text-slate-600 text-xs">All time slots are currently open.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {sortedDates.map(date => (
                  <div key={date} className="bg-white/3 border border-white/8 rounded-xl p-5">
                    <p className="text-slate-300 font-semibold text-sm mb-3 flex items-center gap-2">
                      <CalendarDays size={14} className="text-primary" />
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-slate-500 font-medium mr-1 self-center">Booked:</span>
                      {groupedByDate[date].map((slot, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium">
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default SpacesPage
