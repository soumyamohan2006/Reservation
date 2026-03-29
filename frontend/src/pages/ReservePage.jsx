import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

// Handles both "9AM"/"1PM" (slot format) and "09:00"/"13:00" (input type=time format)
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

function ReservePage({ halls, setHeaderNotice, token }) {
  const { hallId } = useParams()
  const hall = halls.find((item) => item.id === hallId)
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

  useEffect(() => {
    if (!resolvedHallId || !date || !token) return
    setSelectedSlot(null)
    setNeededStart('')
    setNeededEnd('')
    setTimeError('')
    setBookingError('')
    setBookingSuccess('')
    setLoadingSlots(true)
    fetch(`http://localhost:4000/api/slots/available?hallId=${resolvedHallId}&date=${date}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setAvailableSlots(Array.isArray(data) ? data : []))
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [resolvedHallId, date, token])

  const onSlotClick = (slot) => {
    const isSame = selectedSlot?._id === slot._id
    setSelectedSlot(isSame ? null : slot)
    setNeededStart('')
    setNeededEnd('')
    setTimeError('')
    setBookingError('')
  }

  const onBook = async () => {
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

    setIsBooking(true)
    setBookingError('')
    setBookingSuccess('')
    try {
      const res = await fetch('http://localhost:4000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          hallId: resolvedHallId,
          slotId: selectedSlot._id,
          message: `${eventTitle} — ${organizer} | Time needed: ${neededStart}–${neededEnd}`,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setBookingError(data.message); return }
      setBookingSuccess(`Booking submitted for ${selectedSlot.timeSlot} (${neededStart}–${neededEnd}) on ${date}. Awaiting approval.`)
      setSelectedSlot(null)
      setNeededStart('')
      setNeededEnd('')
      setTimeError('')
      setHeaderNotice('submitted')
      fetch(`http://localhost:4000/api/slots/available?hallId=${resolvedHallId}&date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(d => setAvailableSlots(Array.isArray(d) ? d : []))
    } catch {
      setBookingError('Server error. Please try again.')
    } finally {
      setIsBooking(false)
    }
  }

  if (!hall) {
    return (
      <main className="subpage">
        <div className="detail-card">
          <div className="detail-content">
            <h1 className="detail-title">Hall not found</h1>
            <p className="detail-copy">Please return to catalog and choose a valid hall.</p>
            <div className="detail-actions">
              <Link to="/" className="btn btn-primary">Back to Catalog</Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="booking-page" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <section className="booking-card">
        <h1 className="booking-title">Book {hall.name}</h1>
        <p className="booking-subtitle">Fill in your details, pick a date and select an available slot.</p>

        <form className="booking-form" onSubmit={(e) => e.preventDefault()}>
          <div className="booking-two-col">
            <label className="form-field">
              Organizer Name
              <input type="text" placeholder="Your name" value={organizer} onChange={(e) => setOrganizer(e.target.value)} />
            </label>
            <label className="form-field">
              Event Title
              <input type="text" placeholder="e.g. Annual General Meeting" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
            </label>
          </div>

          <label className="form-field form-span-full">
            Select Date
            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setBookingError(''); setBookingSuccess('') }} />
          </label>
        </form>
      </section>

      {date && (
        <section className="booking-card" style={{ marginTop: '2rem', background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)', border: '1px solid rgba(124, 58, 237, 0.3)' }}>
          <h2 className="booking-title" style={{ color: '#ffffff', margin: '0 0 0.25rem' }}>Available Slots</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 1.25rem' }}>{date} • {hall.name}</p>

          {loadingSlots ? (
            <p style={{ color: '#cbd5e1' }}>Loading slots...</p>
          ) : availableSlots.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No available slots for this date. Try another date.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              {availableSlots.map((slot) => {
                const selected = selectedSlot?._id === slot._id
                return (
                  <div key={slot._id}>
                    <div
                      onClick={() => onSlotClick(slot)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.9rem 1rem',
                        background: selected ? '#e0e7ff' : '#ffffff',
                        border: selected ? '2px solid #6d28d9' : '1px solid #cbd5e1',
                        borderRadius: selected ? '0.5rem 0.5rem 0 0' : '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0,
                          border: selected ? '2px solid #6d28d9' : '2px solid #cbd5e1',
                          background: selected ? '#6d28d9' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: selected ? 'white' : '#475569', fontSize: '0.7rem', fontWeight: 'bold',
                        }}>
                          {selected && '✓'}
                        </div>
                        <span style={{ color: '#0f172a', fontSize: '1rem', fontWeight: 600 }}>
                          {slot.timeSlot}
                        </span>
                      </div>
                      {selected && (
                        <span style={{ color: '#6d28d9', fontSize: '0.8rem', fontWeight: 600 }}>SELECTED</span>
                      )}
                    </div>

                    {/* Exact time inputs — expands below selected slot */}
                    {selected && (
                      <div style={{
                        padding: '1rem',
                        background: '#161b22',
                        border: '2px solid #6d28d9',
                        borderTop: 'none',
                        borderRadius: '0 0 0.5rem 0.5rem',
                      }}>
                        <p style={{ color: '#93c5fd', fontSize: '0.82rem', fontWeight: 600, margin: '0 0 0.75rem' }}>
                          Enter the exact time you need within <span style={{ color: '#fff' }}>{slot.timeSlot}</span>
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}>
                            Start Time
                            <input
                              type="time"
                              value={neededStart}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => { setNeededStart(e.target.value); setTimeError('') }}
                              style={{ padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.375rem', color: '#fff', fontSize: '0.9rem' }}
                            />
                          </label>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}>
                            End Time
                            <input
                              type="time"
                              value={neededEnd}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => { setNeededEnd(e.target.value); setTimeError('') }}
                              style={{ padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.375rem', color: '#fff', fontSize: '0.9rem' }}
                            />
                          </label>
                        </div>
                        {timeError && <p style={{ color: '#fca5a5', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>{timeError}</p>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {bookingError && <p style={{ color: '#b91c1c', fontSize: '0.875rem', margin: '1rem 0 0' }}>{bookingError}</p>}
          {bookingSuccess && <p style={{ color: '#15803d', fontSize: '0.875rem', margin: '1rem 0 0' }}>{bookingSuccess}</p>}

          {availableSlots.length > 0 && (
            <button
              type="button"
              className="btn btn-primary btn-confirm"
              onClick={onBook}
              disabled={isBooking || !selectedSlot}
              style={{
                marginTop: '1.5rem',
                opacity: (isBooking || !selectedSlot) ? 0.6 : 1,
                cursor: (isBooking || !selectedSlot) ? 'not-allowed' : 'pointer',
              }}
            >
              {isBooking ? 'Submitting...' : selectedSlot ? `Book ${selectedSlot.timeSlot}` : 'Select a Slot'}
            </button>
          )}
        </section>
      )}
    </main>
  )
}

export default ReservePage
