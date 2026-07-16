import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_URL } from '../config'

const STATUS = {
  Available: { bg: '#f0fdf4', border: '#86efac', text: '#15803d', label: 'Available', dot: '🟢' },
  Booked:    { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c', label: 'Booked',    dot: '🔴' },
  Locked:    { bg: '#fefce8', border: '#fde047', text: '#92400e', label: 'Selected',  dot: '🟡' },
}

function fmtSlot(ts) {
  const toL = t => {
    const m = t.trim().match(/^(\d+)(?::(\d+))?(AM|PM)$/i)
    if (!m) return t
    return `${m[1].padStart(2,'0')}:${(m[2]||'00').padStart(2,'0')} ${m[3].toUpperCase()}`
  }
  const p = ts.match(/^(.+?)-(.+)$/)
  return p ? `${toL(p[1])} – ${toL(p[2])}` : ts
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

const EVENT_ICONS = {
  'Workshop': '🎓',
  'Seminar': '📢',
  'Conference': '🎤',
  'Cultural Event': '🎭',
  'Internal Meeting': '👥',
  'External Event': '🏢',
  'Event': '📌',
}

export default function AvailabilityPage({ halls, token }) {
  const { hallId } = useParams()
  const navigate = useNavigate()
  const hall = halls.find(h => h.id === hallId)
  const resolvedHallId = hall?.mongoId || hallId

  const [date, setDate] = useState('')
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [selections, setSelections] = useState([])
  const [viewMode, setViewMode] = useState('slots')
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(false)

  useEffect(() => {
    if (!date || !resolvedHallId) return
    setLoading(true)
    fetch(`${API_URL}/api/slots/all-for-date?hallId=${resolvedHallId}&date=${date}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setSlots(Array.isArray(d) ? d : []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false))
  }, [date, resolvedHallId, token])

  useEffect(() => {
    if (!date || !resolvedHallId) return
    const interval = setInterval(() => {
      fetch(`${API_URL}/api/slots/all-for-date?hallId=${resolvedHallId}&date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setSlots(d) })
        .catch(() => {})
    }, 15000)
    return () => clearInterval(interval)
  }, [date, resolvedHallId, token])

  useEffect(() => {
    if (viewMode === 'slots' || !resolvedHallId) return
    setEventsLoading(true)
    fetch(`${API_URL}/api/bookings/upcoming/${resolvedHallId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setUpcomingEvents(Array.isArray(d) ? d : []))
      .catch(() => setUpcomingEvents([]))
      .finally(() => setEventsLoading(false))
  }, [viewMode, resolvedHallId, token])

  const handleSlotClick = async (slot) => {
    if (slot.status !== 'Available' && slot.status !== 'Pending') return
    const isSelected = selectedSlotForDate?._id === slot._id
    if (isSelected) {
      await fetch(`${API_URL}/api/slots/${slot._id}/unlock`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      setSelections(prev => prev.filter(s => s.date !== date))
      return
    }
    const lockRes = await fetch(`${API_URL}/api/slots/${slot._id}/lock`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    if (!lockRes.ok) {
      const data = await lockRes.json().catch(() => ({}))
      alert(data.message || 'Slot is currently being selected by another user.')
      return
    }
    setSelections(prev => {
      const exists = prev.find(s => s.date === date)
      if (exists) {
        fetch(`${API_URL}/api/slots/${exists.slot._id}/unlock`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
        return prev.map(s => s.date === date ? { date, slot } : s)
      }
      return [...prev, { date, slot }]
    })
  }

  const removeSelection = (d) => {
    const sel = selections.find(s => s.date === d)
    if (sel) fetch(`${API_URL}/api/slots/${sel.slot._id}/unlock`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    setSelections(prev => prev.filter(s => s.date !== d))
  }

  const selectedSlotForDate = selections.find(s => s.date === date)?.slot

  if (!hall) return (
    <main style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#64748b' }}>Hall not found.</p>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#f1f5f9', padding: '1.5rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.875rem', padding: 0, marginBottom: '0.5rem' }}>← Back</button>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Book {hall.name}</h1>
            <p style={{ color: '#64748b', margin: '0.2rem 0 0', fontSize: '0.875rem' }}>Pick a date → select a slot → continue booking</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Object.entries(STATUS).map(([k, s]) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#64748b', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '999px', padding: '0.25rem 0.75rem' }}>
                {s.dot} {s.label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.25rem', alignItems: 'stretch' }}>

          {/* Left — Hall Info Only */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
            <img src={hall.image} alt={hall.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <div style={{ padding: '1.25rem', flex: 1 }}>
              <p style={{ fontWeight: 800, color: '#0f172a', margin: '0 0 0.3rem', fontSize: '1.15rem' }}>{hall.name}</p>
              <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 0.75rem' }}>Capacity: <strong>{hall.capacity}</strong></p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                {hall.features?.map(f => (
                  <span key={f} style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '999px', border: '1px solid #e2e8f0' }}>{f}</span>
                ))}
              </div>
              {hall.description && (
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>{hall.description}</p>
              )}
            </div>
          </div>

          {/* Right — Toggle + Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>

            {/* View Toggle */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', gap: '0.35rem' }}>
              {[
                { key: 'slots', label: 'Available Slots' },
                { key: 'events', label: 'Upcoming Events' },
                { key: 'all', label: 'Show All' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setViewMode(opt.key)}
                  style={{
                    flex: 1,
                    padding: '0.6rem 1rem',
                    background: viewMode === opt.key ? '#2563eb' : 'transparent',
                    color: viewMode === opt.key ? '#fff' : '#64748b',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: viewMode === opt.key ? 700 : 500,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Available Slots View */}
            {(viewMode === 'slots' || viewMode === 'all') && (
              <>
            {/* Date Picker Card */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem 1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between' }}>
              <p style={{ color: '#475569', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>Select Date</p>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setDate(e.target.value)}
                style={{ padding: '0.5rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.9rem', color: date ? '#0f172a' : '#94a3b8', background: '#f8fafc', colorScheme: 'light', width: '220px', boxSizing: 'border-box' }}
              />
              {date && (
                <span style={{ color: '#2563eb', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtDate(date)}</span>
              )}
            </div>

            {/* Slots Card */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flex: 1, display: 'flex', flexDirection: 'column' }}>
              {!date ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94a3b8', gap: '0.75rem' }}>
                  <span style={{ fontSize: '2.5rem', filter: 'grayscale(1)', opacity: 0.4 }}>📅</span>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>Select a date to view slots</p>
                  <p style={{ fontSize: '0.82rem', margin: 0 }}>Available time slots will appear here</p>
                </div>
              ) : loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#64748b', gap: '0.5rem' }}>
                  <div style={{ width: '18px', height: '18px', border: '2px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: '0.9rem' }}>Loading slots...</span>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : slots.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94a3b8', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2.5rem', filter: 'grayscale(0.5)' }}>🚫</span>
                  <p style={{ fontWeight: 600, margin: 0 }}>No slots for this date</p>
                </div>
              ) : (
                <>
                  <p style={{ color: '#475569', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', margin: '0 0 0.75rem', letterSpacing: '0.04em' }}>
                    Available Slots
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    {slots.map(slot => {
                      const s = STATUS[slot.status] || STATUS.Available
                      const isAvailable = slot.status === 'Available'
                      const isSelected = selectedSlotForDate?._id === slot._id
                      return (
                        <div
                          key={slot._id}
                          onClick={() => handleSlotClick(slot)}
                          style={{
                            display: 'flex', flexDirection: 'column', gap: '0.3rem',
                            padding: '0.85rem 1rem',
                            background: isSelected ? '#dbeafe' : s.bg,
                            border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? '#2563eb' : s.border}`,
                            borderRadius: '0.5rem',
                            cursor: isAvailable ? 'pointer' : 'not-allowed',
                            opacity: isAvailable ? 1 : 0.7,
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => { if (isAvailable) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.15)' } }}
                          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem' }}>{isSelected ? '✓' : s.dot}</span>
                            {isSelected
                              ? <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563eb', background: '#bfdbfe', padding: '0.1rem 0.45rem', borderRadius: '999px' }}>Selected</span>
                              : !isAvailable && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: s.text, background: '#fff', padding: '0.1rem 0.45rem', borderRadius: '999px', border: `1px solid ${s.border}` }}>{s.label}</span>
                            }
                          </div>
                          <span style={{ fontWeight: 700, color: isSelected ? '#1e40af' : s.text, fontSize: '0.9rem' }}>{fmtSlot(slot.timeSlot)}</span>
                          {isAvailable && !isSelected && <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600 }}>Click to select →</span>}
                        </div>
                      )
                    })}
                  </div>
                  {selectedSlotForDate && (
                    <p style={{ color: '#15803d', fontSize: '0.82rem', fontWeight: 600, margin: '1rem 0 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      ✓ Slot selected — change date to add more, or continue below
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Selected + Continue */}
            {selections.length > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
                border: '1px solid #bfdbfe',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
              }}>
                <p style={{ color: '#1e40af', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', margin: '0 0 0.75rem', letterSpacing: '0.04em' }}>
                  Selected ({selections.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {selections.map(s => (
                    <div key={s.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem' }}>📅</span>
                        <div>
                          <p style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.82rem', margin: 0 }}>{fmtDate(s.date)}</p>
                          <p style={{ color: '#2563eb', fontSize: '0.75rem', margin: 0 }}>{fmtSlot(s.slot.timeSlot)}</p>
                        </div>
                      </div>
                      <button onClick={() => removeSelection(s.date)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem', padding: '0 0.25rem', lineHeight: 1 }}>&times;</button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate(`/reserve/${hallId}`, { state: { selections } })}
                  style={{
                    marginTop: '1rem',
                    width: '100%',
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                  }}
                  onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 4px 12px rgba(37,99,235,0.35)' }}
                  onMouseLeave={e => { e.target.style.transform = ''; e.target.style.boxShadow = '0 2px 8px rgba(37,99,235,0.25)' }}
                >
                  Continue Booking →
                </button>
              </div>
            )}
              </>
            )}

            {/* Upcoming Events View */}
            {(viewMode === 'events' || viewMode === 'all') && (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <p style={{ color: '#475569', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', margin: '0 0 1rem', letterSpacing: '0.04em' }}>
                  Upcoming Events — {hall.name}
                </p>
                {eventsLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#64748b', gap: '0.5rem' }}>
                    <div style={{ width: '18px', height: '18px', border: '2px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ fontSize: '0.9rem' }}>Loading events...</span>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94a3b8', gap: '0.5rem' }}>
                    <span style={{ fontSize: '2.5rem', filter: 'grayscale(0.5)' }}>📭</span>
                    <p style={{ fontWeight: 600, margin: 0 }}>No upcoming events</p>
                    <p style={{ fontSize: '0.82rem', margin: 0 }}>Approved bookings will appear here</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {(() => {
                      const grouped = {}
                      upcomingEvents.forEach(ev => {
                        if (!ev.date) return
                        if (!grouped[ev.date]) grouped[ev.date] = []
                        grouped[ev.date].push(ev)
                      })
                      return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, events]) => (
                        <div key={date}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                            <p style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>{fmtDate(date)}</p>
                            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {events.map((ev, i) => {
                              const icon = EVENT_ICONS[ev.eventType] || EVENT_ICONS['Event']
                              return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                                  <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                                  <div style={{ flex: 1 }}>
                                    <p style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.88rem', margin: 0 }}>{ev.eventName}</p>
                                    <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '0.15rem 0 0' }}>{ev.eventType} &middot; {fmtSlot(ev.timeSlot)}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
