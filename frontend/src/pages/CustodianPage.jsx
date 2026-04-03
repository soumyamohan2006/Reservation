import { useState, useEffect } from 'react'
import { API_URL } from '../config'

const TABS = ['Requests', 'Schedule', 'Mark Unavailable', 'History']

const card = { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }
const badge = (status) => ({
  padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
  background: status === 'Approved' ? '#f0fdf4' : status === 'Rejected' ? '#fef2f2' : '#fefce8',
  color: status === 'Approved' ? '#15803d' : status === 'Rejected' ? '#b91c1c' : '#b45309',
})

const TIME_POINTS = ['6AM','7AM','8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM','6PM','7PM','8PM','9PM','10PM']

function toMinutes(t) {
  const m = t.match(/^(\d+)(AM|PM)$/i)
  if (!m) return 0
  let h = parseInt(m[1])
  const p = m[2].toUpperCase()
  if (p === 'PM' && h !== 12) h += 12
  if (p === 'AM' && h === 12) h = 0
  return h * 60
}

export default function CustodianPage({ token, user }) {
  const [tab, setTab] = useState('Requests')
  const [bookings, setBookings] = useState([])
  const [slots, setSlots] = useState([])
  const [halls, setHalls] = useState([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [hallId, setHallId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [slotMsg, setSlotMsg] = useState('')

  const tk = () => token || localStorage.getItem('token')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchBookings(), fetchSlots(), fetchHalls()])
    setLoading(false)
  }

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/bookings/custodian`, { headers: { Authorization: `Bearer ${tk()}` } })
      const data = await res.json()
      if (res.ok) setBookings(data)
    } catch {}
  }

  const fetchSlots = async () => {
    try {
      const res = await fetch(`${API_URL}/api/slots/custodian`, { headers: { Authorization: `Bearer ${tk()}` } })
      const data = await res.json()
      if (res.ok) setSlots(data)
    } catch {}
  }

  const fetchHalls = async () => {
    try {
      const res = await fetch(`${API_URL}/api/halls/custodian`, { headers: { Authorization: `Bearer ${tk()}` } })
      const data = await res.json()
      if (Array.isArray(data)) setHalls(data)
    } catch {}
  }

  const updateStatus = async (id, status) => {
    setMsg('')
    try {
      const res = await fetch(`${API_URL}/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk()}` },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (res.ok) { setMsg(`✅ Booking ${status} successfully.`); fetchAll() }
      else setMsg(`❌ ${data.message}`)
    } catch { setMsg('❌ Failed to update booking.') }
  }

  const markUnavailable = async (e) => {
    e.preventDefault()
    if (!hallId || !date || !startTime || !endTime) { setSlotMsg('All fields are required.'); return }
    setSlotMsg('')
    try {
      const res = await fetch(`${API_URL}/api/slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk()}` },
        body: JSON.stringify({ hallId, date, timeSlot: `${startTime}-${endTime}`, isBooked: true }),
      })
      const data = await res.json()
      if (res.ok) { setSlotMsg('✅ Slot marked as unavailable.'); setDate(''); setStartTime(''); setEndTime(''); fetchSlots() }
      else setSlotMsg(`❌ ${data.message}`)
    } catch { setSlotMsg('❌ Server error.') }
  }

  const deleteSlot = async (id) => {
    try {
      await fetch(`${API_URL}/api/slots/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tk()}` } })
      fetchSlots()
    } catch {}
  }

  const pending = bookings.filter(b => b.status === 'Pending')
  const history = bookings.filter(b => b.status !== 'Pending')
  const endTimeOptions = TIME_POINTS.filter(t => !startTime || toMinutes(t) > toMinutes(startTime))
  const today = new Date().toISOString().split('T')[0]
  const upcoming = slots.filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date))

  const inp = { padding: '0.65rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0.5rem', color: '#0f172a', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' }
  const lbl = { color: '#475569', fontSize: '0.875rem', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: '0.4rem' }

  return (
    <main style={{ minHeight: '100vh', background: '#f1f5f9', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem' }}>🧑‍💼</div>
          <div>
            <h1 style={{ color: '#0f172a', margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Custodian Panel</h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>Welcome, {user || 'Custodian'}</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
            {[
              { label: 'Pending', val: pending.length, color: '#b45309' },
              { label: 'Approved', val: bookings.filter(b => b.status === 'Approved').length, color: '#15803d' },
              { label: 'Upcoming', val: upcoming.length, color: '#2563eb' },
            ].map(s => (
              <div key={s.label} style={{ ...card, padding: '0.75rem 1.25rem', marginBottom: 0, textAlign: 'center' }}>
                <div style={{ color: s.color, fontSize: '1.4rem', fontWeight: 800 }}>{s.val}</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => { setTab(t); setMsg('') }}
              style={{ padding: '0.6rem 1.2rem', background: tab === t ? '#2563eb' : 'transparent', color: tab === t ? '#fff' : '#64748b', border: 'none', borderRadius: '0.5rem 0.5rem 0 0', cursor: 'pointer', fontWeight: tab === t ? 700 : 400, fontSize: '0.9rem' }}>
              {t === 'Requests' && `📋 Requests ${pending.length > 0 ? `(${pending.length})` : ''}`}
              {t === 'Schedule' && '📅 Schedule'}
              {t === 'Mark Unavailable' && '🚫 Mark Unavailable'}
              {t === 'History' && '🕓 History'}
            </button>
          ))}
        </div>

        {msg && <div style={{ padding: '0.75rem 1rem', background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', border: `1px solid ${msg.startsWith('✅') ? '#86efac' : '#fca5a5'}`, borderRadius: '0.5rem', color: msg.startsWith('✅') ? '#15803d' : '#b91c1c', marginBottom: '1rem', fontSize: '0.9rem' }}>{msg}</div>}

        {loading ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '3rem' }}>Loading...</div>
        ) : (
          <>
            {tab === 'Requests' && (
              <div style={card}>
                <h2 style={{ color: '#0f172a', marginTop: 0, fontSize: '1.1rem' }}>📋 Pending Booking Requests</h2>
                {pending.length === 0 ? <p style={{ color: '#64748b' }}>No pending requests.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {pending.map(b => (
                      <div key={b._id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <div style={{ color: '#0f172a', fontWeight: 700 }}>{b.userId?.name} <span style={{ color: '#64748b', fontWeight: 400, fontSize: '0.85rem' }}>({b.userId?.email})</span></div>
                          <div style={{ color: '#2563eb', fontSize: '0.9rem' }}>🏛️ {b.hallId?.name} &nbsp;|&nbsp; 📅 {b.slotId?.date} &nbsp;|&nbsp; ⏱ {b.slotId?.timeSlot}</div>
                          {b.message && <div style={{ color: '#64748b', fontSize: '0.85rem' }}>💬 {b.message}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => updateStatus(b._id, 'Approved')} style={{ padding: '0.5rem 1.1rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.375rem', color: '#15803d', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✅ Approve</button>
                          <button onClick={() => updateStatus(b._id, 'Rejected')} style={{ padding: '0.5rem 1.1rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.375rem', color: '#b91c1c', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>❌ Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'Schedule' && (
              <div style={card}>
                <h2 style={{ color: '#0f172a', marginTop: 0, fontSize: '1.1rem' }}>📅 Upcoming Schedule</h2>
                {upcoming.length === 0 ? <p style={{ color: '#64748b' }}>No upcoming slots.</p> : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        {['Hall', 'Date', 'Time Slot', 'Status'].map(h => <th key={h} style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {upcoming.map(s => (
                          <tr key={s._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem', color: '#0f172a' }}>{s.hallId?.name || '—'}</td>
                            <td style={{ padding: '0.75rem', color: '#0f172a' }}>{s.date}</td>
                            <td style={{ padding: '0.75rem', color: '#2563eb', fontWeight: 600 }}>{s.timeSlot}</td>
                            <td style={{ padding: '0.75rem', background: s.isBooked ? '#fee2e2' : 'transparent' }}><span style={{ ...badge(s.isBooked ? 'Booked' : 'Available'), background: s.isBooked ? '#dc2626' : '#f0fdf4', color: s.isBooked ? '#ffffff' : '#15803d' }}>{s.isBooked ? 'Booked' : 'Available'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === 'Mark Unavailable' && (
              <div style={card}>
                <h2 style={{ color: '#0f172a', marginTop: 0, fontSize: '1.1rem' }}>🚫 Mark Slot as Unavailable</h2>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 0 }}>Block a time slot so users cannot book it.</p>
                <form onSubmit={markUnavailable} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '480px' }}>
                  <label style={lbl}>Hall
                    <select value={hallId} onChange={e => setHallId(e.target.value)} style={inp}>
                      <option value="" disabled>Select a hall</option>
                      {halls.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                    </select>
                  </label>
                  <label style={lbl}>Date
                    <input type="date" value={date} onChange={e => { setDate(e.target.value); setStartTime(''); setEndTime('') }} style={inp} />
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <label style={lbl}>Start Time
                      <select value={startTime} onChange={e => { setStartTime(e.target.value); setEndTime('') }} style={inp}>
                        <option value="" disabled>Start</option>
                        {TIME_POINTS.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </label>
                    <label style={lbl}>End Time
                      <select value={endTime} onChange={e => setEndTime(e.target.value)} disabled={!startTime} style={{ ...inp, color: startTime ? '#0f172a' : '#94a3b8' }}>
                        <option value="" disabled>End</option>
                        {endTimeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </label>
                  </div>
                  {slotMsg && <p style={{ color: slotMsg.startsWith('✅') ? '#15803d' : '#b91c1c', fontSize: '0.85rem', margin: 0 }}>{slotMsg}</p>}
                  <button type="submit" style={{ padding: '0.7rem', background: '#2563eb', border: 'none', borderRadius: '0.5rem', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>🚫 Mark as Unavailable</button>
                </form>
                <div style={{ marginTop: '2rem' }}>
                  <h3 style={{ color: '#475569', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>BLOCKED SLOTS</h3>
                  {slots.filter(s => s.isBooked).length === 0 ? <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No blocked slots.</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {slots.filter(s => s.isBooked).map(s => (
                        <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.375rem', padding: '0.6rem 1rem' }}>
                          <span style={{ color: '#0f172a', fontSize: '0.875rem' }}>{s.hallId?.name} — {s.date} — <b>{s.timeSlot}</b></span>
                          <button onClick={() => deleteSlot(s._id)} style={{ padding: '0.25rem 0.6rem', background: 'transparent', border: '1px solid #fca5a5', borderRadius: '0.375rem', color: '#b91c1c', cursor: 'pointer', fontSize: '0.75rem' }}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'History' && (
              <div style={card}>
                <h2 style={{ color: '#0f172a', marginTop: 0, fontSize: '1.1rem' }}>🕓 Booking History</h2>
                {history.length === 0 ? <p style={{ color: '#64748b' }}>No history yet.</p> : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        {['User', 'Hall', 'Date', 'Time Slot', 'Status'].map(h => <th key={h} style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {history.map(b => (
                          <tr key={b._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 600 }}>{b.userId?.name}</div>
                              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{b.userId?.email}</div>
                            </td>
                            <td style={{ padding: '0.75rem', color: '#0f172a', fontSize: '0.875rem' }}>{b.hallId?.name}</td>
                            <td style={{ padding: '0.75rem', color: '#0f172a', fontSize: '0.875rem' }}>{b.slotId?.date}</td>
                            <td style={{ padding: '0.75rem', color: '#2563eb', fontSize: '0.875rem', fontWeight: 600 }}>{b.slotId?.timeSlot}</td>
                            <td style={{ padding: '0.75rem' }}><span style={badge(b.status)}>{b.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
