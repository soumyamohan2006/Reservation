import { useState, useEffect } from 'react'

const TIME_POINTS = [
  '6AM','7AM','8AM','9AM','10AM','11AM',
  '12PM','1PM','2PM','3PM','4PM','5PM',
  '6PM','7PM','8PM','9PM','10PM'
]

function toMinutes(t) {
  const match = t.match(/^(\d+)(AM|PM)$/i)
  if (!match) return 0
  let h = parseInt(match[1])
  const p = match[2].toUpperCase()
  if (p === 'PM' && h !== 12) h += 12
  if (p === 'AM' && h === 12) h = 0
  return h * 60
}

function AdminPage({ token }) {
  const [hallId, setHallId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [slots, setSlots] = useState([])
  const [halls, setHalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [fixMessage, setFixMessage] = useState('')

  useEffect(() => {
    fetchSlots()
    fetch('http://localhost:4000/api/halls')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setHalls(data) })
      .catch(() => {})
  }, [])

  const fetchSlots = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/slots', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setSlots(data)
    } catch {
      setError('Failed to load slots')
    } finally {
      setLoading(false)
    }
  }

  const fixHallIds = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/slots/fix-hall-ids', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setFixMessage(data.message)
      fetchSlots()
    } catch {
      setFixMessage('Fix failed. Is the backend running?')
    }
  }

  const onAdd = async (e) => {
    e.preventDefault()
    if (!hallId || !date) { setError('Hall and date are required.'); return }
    if (!startTime || !endTime) { setError('Please select both start and end time.'); return }
    const timeSlot = `${startTime}-${endTime}`
    setError('')
    setMessage('')
    try {
      const res = await fetch('http://localhost:4000/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ hallId, date, timeSlot }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setMessage(`Slot "${timeSlot}" added for ${date}`)
      setStartTime('')
      setEndTime('')
      fetchSlots()
    } catch {
      setError('Server error. Is the backend running?')
    }
  }

  const getHallName = (hId) => {
    if (!hId) return 'Unknown Hall'
    if (typeof hId === 'object') return hId.name || 'Unknown Hall'
    const found = halls.find(h => h._id === hId)
    return found ? found.name : 'Unknown Hall'
  }

  const deleteSlot = async (id) => {
    try {
      const res = await fetch(`http://localhost:4000/api/slots/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) fetchSlots()
    } catch {
      setError('Failed to delete slot.')
    }
  }

  const endTimeOptions = TIME_POINTS.filter(t => !startTime || toMinutes(t) > toMinutes(startTime))

  return (
    <main className="booking-page" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <section className="booking-card">
        <h1 className="booking-title">Admin — Add Slots</h1>
        <p className="booking-subtitle">Create available time slots for a hall.</p>

        <form className="booking-form" onSubmit={onAdd}>
          <label className="form-field">
            Hall
            <select value={hallId} className="booking-select-dark" onChange={(e) => setHallId(e.target.value)}>
              <option value="" disabled>Select a hall</option>
              {halls.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
            </select>
          </label>

          <label className="form-field">
            Date
            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setStartTime(''); setEndTime('') }} />
          </label>

          <div className="booking-two-col">
            <label className="form-field">
              Start Time
              <select value={startTime} className="booking-select-dark" onChange={(e) => { setStartTime(e.target.value); setEndTime('') }}>
                <option value="" disabled>Select start time</option>
                {TIME_POINTS.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="form-field">
              End Time
              <select value={endTime} className="booking-select-dark" onChange={(e) => setEndTime(e.target.value)} disabled={!startTime}>
                <option value="" disabled>Select end time</option>
                {endTimeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>

          {startTime && endTime && (
            <div style={{ padding: '0.75rem 1rem', background: '#0f172a', border: '1px solid #4169e1', borderRadius: '0.5rem', color: '#93c5fd', fontSize: '0.9rem', fontWeight: 600 }}>
              ⏱ Slot preview: <span style={{ color: '#fff' }}>{startTime} – {endTime}</span>
            </div>
          )}

          {error && <p style={{ color: '#b91c1c', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
          {message && <p style={{ color: '#15803d', fontSize: '0.875rem', margin: 0 }}>{message}</p>}
          <button type="submit" className="btn btn-primary btn-confirm">Add Slot</button>
        </form>
      </section>

      <section className="booking-card" style={{ marginTop: '2rem', background: '#020b2f', border: '1px solid #1f2937' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="booking-title" style={{ color: '#ffffff', margin: 0 }}>All Slots</h2>
          <button
            type="button"
            onClick={fixHallIds}
            style={{ padding: '0.4rem 0.9rem', background: '#1e3a8a', color: '#93c5fd', border: '1px solid #4169e1', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
          >
            Fix Hall Names
          </button>
        </div>
        {fixMessage && <p style={{ color: '#86efac', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>{fixMessage}</p>}

        {loading ? (
          <p style={{ color: '#cbd5e1', marginTop: '1rem' }}>Loading slots...</p>
        ) : slots.length === 0 ? (
          <p style={{ color: '#cbd5e1', marginTop: '1rem' }}>No slots added yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #1f2937' }}>
                  {['Hall', 'Date', 'Time Slot', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot._id} style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: '0.75rem', color: '#e5e7eb' }}>{slot.hallId?.name || getHallName(slot.hallId)}</td>
                    <td style={{ padding: '0.75rem', color: '#e5e7eb' }}>{slot.date}</td>
                    <td style={{ padding: '0.75rem', color: '#e5e7eb', fontWeight: 600 }}>{slot.timeSlot}</td>
                    <td style={{ padding: '0.75rem', color: slot.isBooked ? '#fca5a5' : '#86efac', fontWeight: 600 }}>
                      {slot.isBooked ? 'Booked' : 'Available'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        onClick={() => deleteSlot(slot._id)}
                        style={{ padding: '0.3rem 0.7rem', background: 'transparent', border: '1px solid #b91c1c', borderRadius: '0.375rem', color: '#fca5a5', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminPage
