import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_URL } from '../config'

const STATUS = {
  Available: { bg: '#f0fdf4', border: '#86efac', text: '#15803d', label: 'Available', dot: '🟢' },
  Booked:    { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c', label: 'Booked',    dot: '🔴' },
  Pending:   { bg: '#fefce8', border: '#fde047', text: '#92400e', label: 'Selected',  dot: '🟡' },
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

export default function AvailabilityPage({ halls, token }) {
  const { hallId } = useParams()
  const navigate = useNavigate()
  const hall = halls.find(h => h.id === hallId)
  const resolvedHallId = hall?.mongoId || hallId

  const [date, setDate] = useState('')
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  // selections: [{ date, slot }]
  const [selections, setSelections] = useState([])

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

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Book {hall.name}</h1>
            <p style={{ color: '#64748b', margin: '0.2rem 0 0', fontSize: '0.875rem' }}>Pick a date → select a slot → pick another date → repeat → then continue</p>
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

          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Hall card + date picker */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flex: 1 }}>
              <img src={hall.image} alt={hall.name} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
              <div style={{ padding: '1rem' }}>
                <p style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 0.2rem', fontSize: '1rem' }}>{hall.name}</p>
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 0.5rem' }}>Capacity: {hall.capacity}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '1rem' }}>
                  {hall.features?.slice(0, 3).map(f => (
                    <span key={f} style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#475569', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>{f}</span>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#475569', fontWeight: 700, fontSize: '0.875rem' }}>
                    Select Date
                    <input
                      type="date"
                      value={date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setDate(e.target.value)}
                      style={{ padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.95rem', color: date ? '#0f172a' : '#94a3b8', background: '#f8fafc', width: '100%', boxSizing: 'border-box', colorScheme: 'light' }}
                    />
                  </label>
                  {date && <p style={{ color: '#2563eb', fontSize: '0.78rem', fontWeight: 600, margin: '0.4rem 0 0' }}>{fmtDate(date)}</p>}
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: '0.5rem 0 0' }}>Select a slot on the right, then change the date to add more.</p>
                </div>
              </div>
            </div>

            {/* Selected dates */}
            {selections.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <p style={{ color: '#475569', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', margin: '0 0 0.75rem' }}>Selected ({selections.length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selections.map(s => (
                    <div key={s.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem' }}>
                      <div>
                        <p style={{ color: '#1e40af', fontWeight: 700, fontSize: '0.8rem', margin: 0 }}>{fmtDate(s.date)}</p>
                        <p style={{ color: '#2563eb', fontSize: '0.75rem', margin: 0 }}>{fmtSlot(s.slot.timeSlot)}</p>
                      </div>
                      <button onClick={() => removeSelection(s.date)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', padding: '0 0.25rem' }}>×</button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate(`/reserve/${hallId}`, { state: { selections } })}
                  style={{ marginTop: '1rem', width: '100%', padding: '0.7rem', background: '#2563eb', border: 'none', borderRadius: '0.5rem', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
                >
                  Continue Booking →
                </button>
              </div>
            )}
          </div>

          {/* Right — Slots */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            {!date ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px', color: '#94a3b8', gap: '0.75rem' }}>
                <span style={{ fontSize: '3rem', filter: 'grayscale(1)' }}>📅</span>
                <p style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>Please select a date</p>
                <p style={{ fontSize: '0.85rem', margin: 0 }}>Available slots will appear here</p>
              </div>
            ) : loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '350px', color: '#64748b' }}>Loading slots...</div>
            ) : slots.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px', color: '#94a3b8', gap: '0.5rem' }}>
                <span style={{ fontSize: '2.5rem', filter: 'grayscale(1)' }}>🚫</span>
                <p style={{ fontWeight: 600, margin: 0 }}>No slots for this date</p>
              </div>
            ) : (
              <>
                <p style={{ color: '#475569', fontWeight: 700, fontSize: '0.875rem', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Slots — {fmtDate(date)}
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
                          transition: 'transform 0.1s, box-shadow 0.1s',
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
                  <p style={{ color: '#15803d', fontSize: '0.82rem', fontWeight: 600, margin: '1rem 0 0' }}>
                    ✓ Slot selected for {fmtDate(date)} — pick another date or continue booking
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
