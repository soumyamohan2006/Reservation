import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Clock, ChevronLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import api from '../services/api'
import { DatePicker } from '../components/DatePicker'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogCloseButton } from '../components/ui/dialog'

function toMinutes(t) {
  if (!t) return 0
  if (t.includes(':')) {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  const match = t.match(/^(\d+)(AM|PM)$/i)
  if (!match) return 0
  let h = parseInt(match[1])
  const p = match[2].toUpperCase()
  if (p === 'PM' && h !== 12) h += 12
  if (p === 'AM' && h === 12) h = 0
  return h * 60
}

function SkeletonSlot() {
  return (
    <div className="animate-pulse h-16 rounded-xl bg-white/5 border border-white/5" />
  )
}

function ReservePage({ halls }) {
  const { hallId } = useParams()
  const navigate = useNavigate()
  const hall = halls.find(item => item.id === hallId || item._id === hallId)
  const resolvedHallId = hall?.mongoId || hallId

  const [date, setDate] = useState('')
  const [organizer, setOrganizer] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [neededStart, setNeededStart] = useState('')
  const [neededEnd, setNeededEnd] = useState('')
  const [timeError, setTimeError] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')
  const [isBooking, setIsBooking] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!resolvedHallId || !date) return
    setSelectedSlot(null)
    setNeededStart('')
    setNeededEnd('')
    setTimeError('')
    setBookingError('')
    setBookingSuccess('')
    setLoadingSlots(true)
    api.getAvailableSlots(resolvedHallId, date)
      .then(d => setAvailableSlots(Array.isArray(d) ? d : []))
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [resolvedHallId, date])

  const onSlotClick = (slot) => {
    const isSame = selectedSlot?._id === slot._id
    setSelectedSlot(isSame ? null : slot)
    setNeededStart('')
    setNeededEnd('')
    setTimeError('')
    setBookingError('')
  }

  const validateBooking = () => {
    if (!organizer || !eventTitle) { setBookingError('Please enter organizer name and event title.'); return }
    if (!selectedSlot) { setBookingError('Please select a time slot.'); return }
    if (!neededStart || !neededEnd) { setBookingError('Please enter your required start and end time.'); return }

    const [slotS, slotE] = selectedSlot.timeSlot.split('-')
    const needStartMin = toMinutes(neededStart)
    const needEndMin = toMinutes(neededEnd)

    if (needStartMin >= needEndMin) { setTimeError('End time must be after start time.'); return }
    if (needStartMin < toMinutes(slotS) || needEndMin > toMinutes(slotE)) {
      setTimeError(`Your time must be within ${selectedSlot.timeSlot}.`)
      return
    }

    return true
  }

  const onBook = () => {
    setBookingError('')
    setBookingSuccess('')
    setTimeError('')

    if (!validateBooking()) return

    setConfirmOpen(true)
  }

  const submitBooking = async () => {
    if (!validateBooking()) return

    setIsBooking(true)
    setBookingError('')
    setBookingSuccess('')
    try {
      await api.createBooking({
        hallId: resolvedHallId,
        slotId: selectedSlot._id,
        message: `${eventTitle} — ${organizer} | Time needed: ${neededStart}–${neededEnd}`,
      })
      setBookingSuccess(`Booking submitted for ${hall.name} on ${date} (${selectedSlot.timeSlot}: ${neededStart}–${neededEnd}). Awaiting approval.`)
      setSelectedSlot(null)
      setNeededStart('')
      setNeededEnd('')
      setTimeError('')
      setConfirmOpen(false)
      const newSlots = await api.getAvailableSlots(resolvedHallId, date)
      setAvailableSlots(Array.isArray(newSlots) ? newSlots : [])
    } catch (err) {
      setBookingError(err?.data?.message || 'Server error. Please try again.')
    } finally {
      setIsBooking(false)
    }
  }

  if (!hall) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="glass-panel rim-light rounded-2xl p-16 max-w-md border border-white/5">
          <AlertCircle size={48} className="text-primary mx-auto mb-6" strokeWidth={1} />
          <h1 className="font-headline text-3xl text-white mb-3">Hall not found</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">The space you're looking for doesn't exist or may have been removed.</p>
          <Link to="/" className="px-8 py-3 rounded-full bg-primary/20 border border-primary/30 text-primary font-bold hover:bg-primary/30 transition-colors">
            Back to Spaces
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 pb-32 pt-8 w-full">
      {/* Back link */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors group">
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to spaces
      </button>

      {/* Header */}
      <div className="mb-8">
        <p className="text-primary text-xs uppercase tracking-widest font-bold mb-2">Reservation</p>
        <h1 className="font-headline text-4xl md:text-5xl text-white mb-3">{hall.name}</h1>
        <p className="text-slate-400 font-light">Fill in your details, pick a date and select an available slot.</p>
      </div>

      {/* Form card */}
      <div className="glass-panel rim-light rounded-2xl p-8 border border-white/5 mb-6">
        <h2 className="text-white font-semibold text-sm uppercase tracking-widest mb-6 opacity-60">Event Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold tracking-widest uppercase text-slate-500">Organizer Name</label>
            <input
              type="text"
              placeholder="Your full name"
              value={organizer}
              onChange={e => setOrganizer(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 text-sm focus:border-primary/50 focus:bg-primary/5 outline-none transition-all"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold tracking-widest uppercase text-slate-500">Event Title</label>
            <input
              type="text"
              placeholder="e.g. Annual General Meeting"
              value={eventTitle}
              onChange={e => setEventTitle(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 text-sm focus:border-primary/50 focus:bg-primary/5 outline-none transition-all"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold tracking-widest uppercase text-slate-500 block">Select Date</label>
          <DatePicker
            value={date}
            onChange={(d) => { setDate(d); setBookingError(''); setBookingSuccess('') }}
            placeholder="Pick a date…"
          />
        </div>
      </div>

      {/* Slot picker */}
      {date && (
        <div className="glass-panel rim-light rounded-2xl p-8 border border-white/5 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-white font-semibold text-sm uppercase tracking-widest opacity-60">Available Slots</h2>
              <p className="text-slate-500 text-sm mt-1">
                {date ? format(parseISO(date), 'PPP') : ''} · {hall.name}
              </p>
            </div>
            {selectedSlot && (
              <span className="px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold tracking-wide">
                {selectedSlot.timeSlot} selected
              </span>
            )}
          </div>

          {loadingSlots ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <SkeletonSlot key={i} />)}
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Clock size={36} className="text-slate-700" strokeWidth={1} />
              <p className="text-slate-400 text-sm">No available slots for this date.<br />Try selecting another date.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {availableSlots.map(slot => {
                const selected = selectedSlot?._id === slot._id
                return (
                  <div key={slot._id}>
                    <button
                      onClick={() => onSlotClick(slot)}
                      className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border transition-all duration-200 text-left ${
                        selected
                          ? 'bg-primary/15 border-primary/50 shadow-[0_0_20px_rgba(77,142,255,0.1)]'
                          : 'bg-white/3 border-white/10 hover:bg-white/8 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          selected ? 'border-primary bg-primary' : 'border-slate-600'
                        }`}>
                          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className={`font-semibold text-sm ${selected ? 'text-primary' : 'text-white'}`}>
                          {slot.timeSlot}
                        </span>
                      </div>
                      {selected && <span className="text-primary/80 text-xs font-bold uppercase tracking-widest">Selected</span>}
                    </button>

                    {/* Expanded time picker */}
                    {selected && (
                      <div className="mx-1 px-5 py-5 bg-[#0a0a14] border border-primary/30 border-t-0 rounded-b-xl">
                        <p className="text-slate-400 text-xs font-medium mb-4">
                          Enter the exact time you need within <span className="text-primary font-bold">{slot.timeSlot}</span>
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Start Time</label>
                            <input
                              type="time"
                              value={neededStart}
                              onClick={e => e.stopPropagation()}
                              onChange={e => { setNeededStart(e.target.value); setTimeError('') }}
                              className="bg-white/5 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-primary/50 transition-all [color-scheme:dark]"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">End Time</label>
                            <input
                              type="time"
                              value={neededEnd}
                              onClick={e => e.stopPropagation()}
                              onChange={e => { setNeededEnd(e.target.value); setTimeError('') }}
                              className="bg-white/5 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-primary/50 transition-all [color-scheme:dark]"
                            />
                          </div>
                        </div>
                        {timeError && (
                          <p className="text-red-400 text-xs mt-3 flex items-center gap-1.5">
                            <AlertCircle size={12} /> {timeError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Feedback messages */}
      {bookingError && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">
          <AlertCircle size={16} className="flex-shrink-0" />
          {bookingError}
        </div>
      )}
      {bookingSuccess && (
        <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm mb-4">
          <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
          {bookingSuccess}
        </div>
      )}

      {/* Submit button */}
      {date && availableSlots.length > 0 && (
        <Button
          onClick={onBook}
          disabled={isBooking || !selectedSlot}
          className="w-full h-auto py-4 rounded-2xl text-sm tracking-wide justify-center"
          variant={isBooking || !selectedSlot ? 'secondary' : 'default'}
        >
          {isBooking ? <><Loader2 size={18} className="animate-spin" /> Submitting…</> : selectedSlot ? `Confirm Booking — ${selectedSlot.timeSlot}` : 'Select a slot to continue'}
        </Button>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogCloseButton onClick={() => setConfirmOpen(false)} />
          <DialogHeader>
            <DialogTitle>Confirm booking</DialogTitle>
            <DialogDescription>
              Review the request before it is sent for approval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-xl border border-white/10 bg-white/3 p-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Hall</span>
              <span className="text-white font-medium text-right">{hall.name}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Date</span>
              <span className="text-white font-medium text-right">{date ? format(parseISO(date), 'PPP') : '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Time slot</span>
              <span className="text-primary font-semibold text-right">{selectedSlot?.timeSlot}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Requested time</span>
              <span className="text-white font-medium text-right">{neededStart} – {neededEnd}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Organizer</span>
              <span className="text-white font-medium text-right">{organizer}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Event</span>
              <span className="text-white font-medium text-right">{eventTitle}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isBooking}>
              Cancel
            </Button>
            <Button onClick={submitBooking} disabled={isBooking}>
              {isBooking ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : 'Send booking request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ReservePage
