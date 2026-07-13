import { useState, useMemo } from 'react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function fmtDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CalendarView({ bookings = [], slots = [], halls = [] }) {
  const [current, setCurrent] = useState(() => new Date())
  const [selected, setSelected] = useState(null)

  const year = current.getFullYear()
  const month = current.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  const byDate = useMemo(() => {
    const map = {}
    bookings.forEach(b => {
      const d = b.slotId?.date
      if (!d) return
      if (!map[d]) map[d] = { bookings: [], slots: [] }
      map[d].bookings.push(b)
    })
    slots.forEach(s => {
      if (!map[s.date]) map[s.date] = { bookings: [], slots: [] }
      map[s.date].slots.push(s)
    })
    return map
  }, [bookings, slots])

  const monthLabel = current.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const prev = () => setCurrent(new Date(year, month - 1, 1))
  const next = () => setCurrent(new Date(year, month + 1, 1))
  const goToday = () => { setCurrent(new Date()); setSelected(new Date().toISOString().split('T')[0]) }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const selectedData = selected ? byDate[selected] : null

  const bg = '#1e293b'
  const surface = '#0f172a'
  const border = '#334155'
  const text = '#e2e8f0'
  const muted = '#94a3b8'
  const accent = '#60a5fa'

  return (
    <div style={{ background: bg, borderRadius: '0.75rem', padding: '1.25rem', color: text }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={prev} style={{ background: surface, border: `1px solid ${border}`, borderRadius: '0.375rem', padding: '0.4rem 0.8rem', cursor: 'pointer', color: muted, fontSize: '0.9rem' }}>←</button>
        <span style={{ fontWeight: 700, color: text, fontSize: '1.1rem', minWidth: '180px', textAlign: 'center' }}>{monthLabel}</span>
        <button onClick={next} style={{ background: surface, border: `1px solid ${border}`, borderRadius: '0.375rem', padding: '0.4rem 0.8rem', cursor: 'pointer', color: muted, fontSize: '0.9rem' }}>→</button>
        <button onClick={goToday} style={{ background: '#1e3a5f', border: `1px solid ${accent}`, borderRadius: '0.375rem', padding: '0.4rem 0.8rem', cursor: 'pointer', color: accent, fontWeight: 600, fontSize: '0.8rem', marginLeft: '0.5rem' }}>Today</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {DAYS.map(d => (
          <div key={d} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700, color: muted, fontSize: '0.75rem', textTransform: 'uppercase' }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`empty-${i}`} />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const data = byDate[dateStr]
          const hasBookings = data?.bookings?.length > 0
          const hasSlots = data?.slots?.length > 0
          const bookedSlots = data?.slots?.filter(s => s.isBooked).length || 0
          const availSlots = data?.slots?.filter(s => !s.isBooked).length || 0
          const isToday = dateStr === today
          const isSelected = dateStr === selected

          return (
            <div
              key={dateStr}
              onClick={() => setSelected(isSelected ? null : dateStr)}
              style={{
                padding: '0.5rem', minHeight: '60px', cursor: 'pointer', borderRadius: '0.375rem',
                background: isSelected ? '#1e3a5f' : isToday ? '#1a2744' : surface,
                border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? accent : isToday ? '#22d3ee' : border}`,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#1a2744' }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? '#1a2744' : surface }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isToday ? '#22d3ee' : text, marginBottom: '0.25rem' }}>{d}</div>
              {hasSlots && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                  {availSlots > 0 && <span style={{ fontSize: '0.6rem', background: '#064e3b', color: '#6ee7b7', padding: '1px 4px', borderRadius: '999px', fontWeight: 700 }}>{availSlots} free</span>}
                  {bookedSlots > 0 && <span style={{ fontSize: '0.6rem', background: '#7f1d1d', color: '#fca5a5', padding: '1px 4px', borderRadius: '999px', fontWeight: 700 }}>{bookedSlots} booked</span>}
                </div>
              )}
              {hasBookings && (
                <div style={{ marginTop: '2px' }}>
                  {bookings.filter(b => b.slotId?.date === dateStr).slice(0, 2).map(b => (
                    <div key={b._id} style={{ fontSize: '0.55rem', padding: '1px 4px', borderRadius: '2px', marginBottom: '1px', fontWeight: 600, background: b.status === 'Approved' ? '#064e3b' : b.status === 'Rejected' ? '#7f1d1d' : b.status === 'CustodianApproved' ? '#2e1065' : '#78350f', color: b.status === 'Approved' ? '#6ee7b7' : b.status === 'Rejected' ? '#fca5a5' : b.status === 'CustodianApproved' ? '#c4b5fd' : '#fbbf24' }}>
                      {b.hallId?.name || 'Hall'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setSelected(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', background: bg, border: `1px solid ${border}`, borderRadius: '0.75rem', padding: '1.5rem', width: '100%', maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: text, fontSize: '1rem' }}>{fmtDate(selected)}</h3>
              <button onClick={() => setSelected(null)} style={{ background: surface, border: `1px solid ${border}`, borderRadius: '0.375rem', padding: '0.3rem 0.6rem', cursor: 'pointer', color: muted, fontSize: '0.85rem' }}>✕</button>
            </div>
            {selectedData ? (
              <>
                {selectedData.bookings?.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ color: accent, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 0.5rem', letterSpacing: '0.05em' }}>Bookings ({selectedData.bookings.length})</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {selectedData.bookings.map(b => {
                        const statusBg = b.status === 'Approved' ? '#064e3b' : b.status === 'Rejected' ? '#7f1d1d' : b.status === 'CustodianApproved' ? '#2e1065' : '#78350f'
                        const statusColor = b.status === 'Approved' ? '#6ee7b7' : b.status === 'Rejected' ? '#fca5a5' : b.status === 'CustodianApproved' ? '#c4b5fd' : '#fbbf24'
                        return (
                          <div key={b._id} style={{ padding: '0.6rem 0.75rem', background: surface, border: `1px solid ${border}`, borderRadius: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                              <span style={{ fontSize: '0.85rem', color: text, fontWeight: 700 }}>{b.hallId?.name || 'Hall'}</span>
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', background: statusBg, color: statusColor }}>{b.status}</span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: muted }}>{b.userId?.name || 'Unknown'} &middot; {b.userId?.email}</div>
                            <div style={{ fontSize: '0.78rem', color: accent, fontWeight: 600, marginTop: '0.15rem' }}>{b.slotId?.timeSlot}</div>
                            {b.message && <div style={{ fontSize: '0.75rem', color: muted, marginTop: '0.25rem', fontStyle: 'italic' }}>"{b.message}"</div>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {selectedData.slots?.length > 0 && (
                  <div>
                    <p style={{ color: accent, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 0.5rem', letterSpacing: '0.05em' }}>Slots ({selectedData.slots.length})</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {selectedData.slots.map(s => (
                        <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: s.isBooked ? '#7f1d1d15' : '#064e3b15', border: `1px solid ${s.isBooked ? '#7f1d1d50' : '#064e3b50'}`, borderRadius: '0.375rem' }}>
                          <span style={{ fontSize: '0.82rem', color: text, fontWeight: 600 }}>{s.timeSlot}</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', background: s.isBooked ? '#7f1d1d' : '#064e3b', color: s.isBooked ? '#fca5a5' : '#6ee7b7' }}>{s.isBooked ? 'Booked' : 'Available'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedData.slots?.length === 0 && selectedData.bookings?.length === 0 && (
                  <p style={{ color: muted, fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>No events on this date.</p>
                )}
              </>
            ) : (
              <p style={{ color: muted, fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>No events on this date.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
