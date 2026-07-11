import { useEffect, useState } from 'react'
import { API_URL } from '../config'

const statusColor = (s) => s === 'Approved' ? '#15803d' : s === 'Rejected' ? '#b91c1c' : s === 'CustodianApproved' ? '#7c3aed' : '#b45309'
const statusBg = (s) => s === 'Approved' ? '#f0fdf4' : s === 'Rejected' ? '#fef2f2' : s === 'CustodianApproved' ? '#f5f3ff' : '#fffbeb'
const statusLabel = (s) => s === 'CustodianApproved' ? 'Awaiting Principal' : s
const statusIcon = (s) => s === 'Approved' ? '✅' : s === 'Rejected' ? '❌' : s === 'CustodianApproved' ? '⏳' : '🕐'

export default function MyBookingsPage({ token }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [filter, setFilter] = useState('All')

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

  const filtered = filter === 'All' ? bookings : bookings.filter(b => b.status === filter)
  const counts = {
    All: bookings.length,
    Pending: bookings.filter(b => b.status === 'Pending').length,
    Approved: bookings.filter(b => b.status === 'Approved').length,
    CustodianApproved: bookings.filter(b => b.status === 'CustodianApproved').length,
    Rejected: bookings.filter(b => b.status === 'Rejected').length,
  }

  const filters = ['All', 'Pending', 'Approved', 'CustodianApproved', 'Rejected'].filter(f => counts[f] > 0)

  return (
    <main style={{ minHeight: '100vh', background: '#f1f5f9', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ color: '#0f172a', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>My Bookings</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.3rem 0 0' }}>Track and manage your hall reservations</p>
        </div>

        {msg && (
          <div style={{ padding: '0.7rem 1rem', background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', border: `1px solid ${msg.startsWith('✅') ? '#86efac' : '#fca5a5'}`, borderRadius: '0.5rem', color: msg.startsWith('✅') ? '#15803d' : '#b91c1c', marginBottom: '1rem', fontSize: '0.875rem' }}>{msg}</div>
        )}

        {!loading && bookings.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: `1px solid ${filter === f ? '#2563eb' : '#e2e8f0'}`,
                  background: filter === f ? '#2563eb' : '#fff',
                  color: filter === f ? '#fff' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {f === 'CustodianApproved' ? 'Awaiting' : f} ({counts[f]})
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: '#fff', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
                <div style={{ height: '14px', width: '120px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '0.75rem', animation: 'shimmer 1.5s infinite' }} />
                <div style={{ height: '10px', width: '200px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '0.5rem' }} />
                <div style={{ height: '10px', width: '160px', background: '#f1f5f9', borderRadius: '4px' }} />
              </div>
            ))}
            <style>{`@keyframes shimmer { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <h2 style={{ color: '#0f172a', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>No bookings yet</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>Browse available spaces and make your first reservation.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>No {filter.toLowerCase()} bookings.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map(b => {
              const segments = (b.message || '').split('|').map(s => s.trim())
              const event = segments[0] || ''
              const participants = segments.find(s => /^participants:/i.test(s)) || ''
              const timeNeeded = segments.find(s => /^time needed:/i.test(s)) || ''
              return (
                <div key={b._id} style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  borderRadius: '0.875rem',
                  padding: '1.25rem 1.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)',
                  border: 'none',
                  borderLeft: `4px solid ${statusColor(b.status)}`,
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.03)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}
                >
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `radial-gradient(circle at top right, ${statusColor(b.status)}08 0%, transparent 70%)`, pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{b.hallId?.name}</span>
                      </div>
                      {event && <div style={{ color: '#475569', fontSize: '0.85rem' }}>{event}</div>}
                    </div>
                    <span style={{
                      padding: '0.3rem 0.85rem',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: statusBg(b.status),
                      color: statusColor(b.status),
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      border: `1px solid ${statusColor(b.status)}20`,
                    }}>
                      {statusIcon(b.status)} {statusLabel(b.status)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.65rem', fontSize: '0.82rem', color: '#64748b', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>📅 {b.slotId?.date}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>🕐 {b.slotId?.timeSlot}</span>
                    {participants && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>👥 {participants.replace('Participants:', '').trim()}</span>}
                    {timeNeeded && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>⏱ {timeNeeded.replace('Time needed:', '').trim()}</span>}
                  </div>

                  {(b.status === 'Pending' || b.status === 'Approved' || b.status === 'CustodianApproved') && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #f1f5f9' }}>
                      <button
                        onClick={() => cancel(b._id)}
                        style={{
                          padding: '0.35rem 0.9rem',
                          background: 'transparent',
                          border: '1px solid #fca5a5',
                          borderRadius: '0.375rem',
                          color: '#b91c1c',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.target.style.background = '#fef2f2'; e.target.style.borderColor = '#f87171' }}
                        onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = '#fca5a5' }}
                      >
                        Cancel Booking
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginTop: '1.5rem' }}>
            Showing {filtered.length} of {bookings.length} bookings
          </p>
        )}
      </div>
    </main>
  )
}
