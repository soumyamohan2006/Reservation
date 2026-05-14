import { useEffect, useState } from 'react'
import { API_URL } from '../config'

const statusColor = (s) => s === 'Approved' ? '#15803d' : s === 'Rejected' ? '#b91c1c' : '#b45309'
const statusBg = (s) => s === 'Approved' ? '#f0fdf4' : s === 'Rejected' ? '#fef2f2' : '#fffbeb'

export default function MyBookingsPage({ token }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${API_URL}/api/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const d = await r.json()
      if (r.ok) setBookings(d)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchBookings() }, [])

  const cancel = async (id) => {
    if (!confirm('Cancel this booking?')) return
    const r = await fetch(`${API_URL}/api/bookings/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    const d = await r.json()
    if (r.ok) { setMsg('✅ Booking cancelled.'); fetchBookings() }
    else setMsg(`❌ ${d.message}`)
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f1f5f9', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#0f172a', fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>📋 My Bookings</h1>
        {msg && (
          <div style={{ padding: '0.7rem 1rem', background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', border: `1px solid ${msg.startsWith('✅') ? '#86efac' : '#fca5a5'}`, borderRadius: '0.5rem', color: msg.startsWith('✅') ? '#15803d' : '#b91c1c', marginBottom: '1rem', fontSize: '0.875rem' }}>{msg}</div>
        )}
        {loading ? (
          <p style={{ color: '#64748b' }}>Loading...</p>
        ) : bookings.length === 0 ? (
          <p style={{ color: '#64748b' }}>No bookings yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {bookings.map(b => {
              const [event, timeNeeded] = (b.message || '').split('|').map(s => s.trim())
              return (
                <div key={b._id} style={{ background: '#fff', border: `1px solid ${statusColor(b.status)}40`, borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${statusColor(b.status)}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{b.hallId?.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '0.25rem' }}>{event}</div>
                    </div>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: statusBg(b.status), color: statusColor(b.status), whiteSpace: 'nowrap' }}>
                      {b.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.82rem', color: '#475569', flexWrap: 'wrap' }}>
                    <span>📅 {b.slotId?.date}</span>
                    <span>🕐 {b.slotId?.timeSlot}</span>
                    {timeNeeded && <span>⏱ {timeNeeded.replace('Time needed:', '').trim()}</span>}
                  </div>
                  {(b.status === 'Pending' || b.status === 'Approved') && (
                    <button
                      onClick={() => cancel(b._id)}
                      style={{ marginTop: '0.75rem', padding: '0.4rem 1rem', background: 'transparent', border: '1px solid #fca5a5', borderRadius: '0.375rem', color: '#b91c1c', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
