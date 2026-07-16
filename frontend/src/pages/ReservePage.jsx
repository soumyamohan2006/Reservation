import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { API_URL } from '../config'

const EVENT_TYPES = ['Internal Meeting', 'Workshop', 'Seminar', 'Conference', 'Cultural Event', 'External Event']
const PRINCIPAL_TYPES = ['Conference', 'Cultural Event', 'External Event']
const EQUIPMENT = ['Projector', 'Microphone', 'Sound System', 'Podium', 'AC']

function fmtSlot(ts) {
  if (!ts) return ''
  const toL = t => { const m = t.trim().match(/^(\d+)(?::(\d+))?(AM|PM)$/i); if (!m) return t; return `${m[1].padStart(2,'0')}:${(m[2]||'00').padStart(2,'0')} ${m[3].toUpperCase()}` }
  const p = ts.match(/^(.+?)-(.+)$/); return p ? `${toL(p[1])} – ${toL(p[2])}` : ts
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

function to12hr(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const p = h < 12 ? 'AM' : 'PM'
  const dh = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${dh}:${String(m).padStart(2, '0')} ${p}`
}

function toMinutes(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function slotToMinutes(t) {
  const m = t.trim().match(/^(\d+)(?::(\d+))?(AM|PM)$/i)
  if (!m) return 0
  let h = parseInt(m[1])
  if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12
  if (m[3].toUpperCase() === 'AM' && h === 12) h = 0
  return h * 60 + parseInt(m[2] || 0)
}

const inp = { padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.95rem', color: '#0f172a', background: '#f8fafc', width: '100%', boxSizing: 'border-box' }
const lbl = { display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#475569', fontWeight: 600, fontSize: '0.875rem' }

function ReservePage({ halls, setHeaderNotice, token }) {
  const { hallId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const hall = halls.find(h => h.id === hallId)
  const resolvedHallId = hall?.mongoId || hallId

  const preDate = location.state?.date || ''
  const preSlot = location.state?.slot || null
  // Multi-date support
  const selections = location.state?.selections || (preDate && preSlot ? [{ date: preDate, slot: preSlot }] : [])

  const [organizer, setOrganizer] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventType, setEventType] = useState('')
  const [participants, setParticipants] = useState('')
  const [neededStart, setNeededStart] = useState('')
  const [neededEnd, setNeededEnd] = useState('')
  const [timeError, setTimeError] = useState('')
  const [equipment, setEquipment] = useState([])
  const [isBooking, setIsBooking] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')

  useEffect(() => {
    return () => {
      selections.forEach(s => {
        fetch(`${API_URL}/api/slots/${s.slot._id}/unlock`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      })
    }
  }, [])

  const toggleEquipment = (item) => setEquipment(prev => prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item])

  const validateTime = (start, end) => {
    if (!start || !end) return
    const slotParts = selections[0]?.slot?.timeSlot.match(/^(.+?)-(.+)$/)
    if (!slotParts) return
    const slotStart = slotToMinutes(slotParts[1])
    const slotEnd = slotToMinutes(slotParts[2])
    const s = toMinutes(start), e = toMinutes(end)
    if (s >= e) { setTimeError('End time must be after start time.'); return }
    if (s < slotStart || e > slotEnd) { setTimeError(`Time must be within the selected slot.`); return }
    setTimeError('')
  }

  const onBook = async () => {
    if (!organizer || !eventTitle || !eventType) { setBookingError('Please fill in all required fields.'); return }
    if (timeError) { setBookingError(timeError); return }
    if (!selections.length) { setBookingError('No slot selected.'); return }

    const slotParts = selections[0]?.slot?.timeSlot.match(/^(.+?)-(.+)$/)
    const startFinal = neededStart || (slotParts ? slotParts[1] : '')
    const endFinal = neededEnd || (slotParts ? slotParts[2] : '')

    setIsBooking(true)
    setBookingError('')
    setBookingSuccess('')
    try {
      const equipmentStr = equipment.length > 0 ? ` | Equipment: ${equipment.join(', ')}` : ''
      const participantStr = participants ? ` | Participants: ${participants}` : ''
      const results = await Promise.all(selections.map(({ slot }) =>
        fetch(`${API_URL}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            hallId: resolvedHallId,
            slotId: slot._id,
            eventType,
            message: `${eventTitle} — ${organizer}${participantStr} | Time needed: ${to12hr(startFinal)}–${to12hr(endFinal)}${equipmentStr}`,
          }),
        }).then(r => r.json())
      ))
      const failed = results.filter(r => r.message && !r._id)
      if (failed.length) { setBookingError(failed[0].message); return }
      setBookingSuccess(`${selections.length} booking(s) submitted! Awaiting approval.`)
      setHeaderNotice(`Your booking request for ${hall.name} has been submitted successfully.`)
      setTimeout(() => navigate('/my-bookings'), 2000)
    } catch {
      setBookingError('Server error. Please try again.')
    } finally {
      setIsBooking(false)
    }
  }

  if (!hall) return (
    <main className="subpage"><div className="detail-card"><div className="detail-content">
      <h1 className="detail-title">Hall not found</h1>
      <Link to="/" className="btn btn-primary">Back to Catalog</Link>
    </div></div></main>
  )

  if (!selections.length) {
    navigate(`/availability/${hallId}`, { replace: true })
    return null
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f1f5f9', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.9rem', padding: 0, marginBottom: '1rem' }}>← Back</button>

        {/* Pre-filled summary */}
        <div style={{ background: '#eff6ff', border: '2px solid #2563eb', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 0.75rem' }}>Hall — {hall.name}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem' }}>
            {selections.map(s => (
              <div key={s.date} style={{ background: '#fff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '0.6rem 0.85rem' }}>
                <p style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, margin: '0 0 0.15rem' }}>{fmtDate(s.date)}</p>
                <p style={{ color: '#1e40af', fontWeight: 700, fontSize: '0.875rem', margin: 0 }}>{fmtSlot(s.slot.timeSlot)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.2rem', margin: '0 0 1.5rem' }}>Booking Details</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label style={lbl}>
              Organizer Name *
              <input style={inp} placeholder="Your full name" value={organizer} onChange={e => setOrganizer(e.target.value)} />
            </label>
            <label style={lbl}>
              Event Title *
              <input style={inp} placeholder="e.g. Annual Tech Fest" value={eventTitle} onChange={e => setEventTitle(e.target.value)} />
            </label>
            <label style={lbl}>
              Event Type *
              <select style={{ ...inp, color: eventType ? '#0f172a' : '#94a3b8' }} value={eventType} onChange={e => setEventType(e.target.value)}>
                <option value="" disabled style={{ color: '#94a3b8' }}>Select event type</option>
                {EVENT_TYPES.map(t => <option key={t} value={t} style={{ color: '#0f172a' }}>{t}</option>)}
              </select>
              {eventType && PRINCIPAL_TYPES.includes(eventType) && (
                <span style={{ fontSize: '0.75rem', color: '#92400e', background: '#fef9c3', padding: '0.2rem 0.5rem', borderRadius: '999px', display: 'inline-block', marginTop: '0.25rem' }}>⚠️ Requires Principal approval</span>
              )}
            </label>
            <label style={lbl}>
              Expected Participants
              <input style={inp} type="number" min="1" placeholder="e.g. 150" value={participants} onChange={e => setParticipants(e.target.value)} />
            </label>
          </div>

          {/* Needed Time */}
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
            <p style={{ color: '#475569', fontWeight: 700, fontSize: '0.875rem', margin: '0 0 0.75rem' }}>⏱ Time Needed <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional — defaults to full slot)</span></p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <label style={lbl}>
                Start Time
                <input type="time" style={inp} value={neededStart} onChange={e => { setNeededStart(e.target.value); validateTime(e.target.value, neededEnd) }} />
              </label>
              <label style={lbl}>
                End Time
                <input type="time" style={inp} value={neededEnd} onChange={e => { setNeededEnd(e.target.value); validateTime(neededStart, e.target.value) }} />
              </label>
            </div>
            {timeError && <p style={{ color: '#b91c1c', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>{timeError}</p>}
            {neededStart && neededEnd && !timeError && (
              <p style={{ color: '#2563eb', fontSize: '0.82rem', margin: '0.5rem 0 0', fontWeight: 600 }}>✓ {to12hr(neededStart)} – {to12hr(neededEnd)}</p>
            )}
          </div>

          {/* Equipment */}
          <div style={{ marginTop: '1.25rem' }}>
            <p style={{ color: '#475569', fontWeight: 600, fontSize: '0.875rem', margin: '0 0 0.75rem' }}>Equipment Required</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {EQUIPMENT.map(item => {
                const checked = equipment.includes(item)
                return (
                  <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', border: `1px solid ${checked ? '#2563eb' : '#cbd5e1'}`, borderRadius: '999px', background: checked ? '#eff6ff' : '#f8fafc', cursor: 'pointer', fontSize: '0.875rem', color: checked ? '#1e40af' : '#475569', fontWeight: checked ? 700 : 400, userSelect: 'none' }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleEquipment(item)} style={{ display: 'none' }} />
                    {checked ? '✓ ' : ''}{item}
                  </label>
                )
              })}
            </div>
          </div>

          {bookingError && <p style={{ color: '#b91c1c', fontSize: '0.875rem', margin: '1rem 0 0', background: '#fef2f2', padding: '0.6rem 0.85rem', borderRadius: '0.375rem' }}>{bookingError}</p>}
          {bookingSuccess && <p style={{ color: '#15803d', fontSize: '0.875rem', margin: '1rem 0 0', background: '#f0fdf4', padding: '0.6rem 0.85rem', borderRadius: '0.375rem' }}>✅ {bookingSuccess}</p>}

          <button
            onClick={onBook}
            disabled={isBooking}
            style={{ marginTop: '1.75rem', width: '100%', padding: '0.9rem', background: isBooking ? '#93c5fd' : '#2563eb', border: 'none', borderRadius: '0.5rem', color: '#fff', fontWeight: 800, fontSize: '1.05rem', cursor: isBooking ? 'not-allowed' : 'pointer' }}
          >
            {isBooking ? 'Submitting...' : 'Submit Booking'}
          </button>
        </div>
      </div>
    </main>
  )
}

export default ReservePage
