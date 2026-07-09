import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { API_URL } from '../config'

function HallDetailsPage({ halls, token }) {
  const { hallId } = useParams()
  const hall = halls.find((item) => item.id === hallId)
  const resolvedHallId = hall?.mongoId || hallId

  const [date, setDate] = useState('')
  const [bookedSlots, setBookedSlots] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchBooked = async (d) => {
    if (!d || !resolvedHallId) return
    setLoading(true)
    try {
      const r = await fetch(`${API_URL}/api/slots/booked?hallId=${resolvedHallId}&date=${d}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await r.json()
      setBookedSlots(Array.isArray(data) ? data : [])
    } catch { setBookedSlots([]) }
    setLoading(false)
  }

  if (!hall) {
    return (
      <main className="subpage">
        <div className="detail-card">
          <div className="detail-content">
            <h1 className="detail-title">Hall not found</h1>
            <p className="detail-copy">The selected hall does not exist in the current catalog.</p>
            <div className="detail-actions">
              <Link to="/" className="btn btn-primary">
                Back to Catalog
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="subpage">
      <article className="detail-card">
        <img src={hall.image} alt={hall.name} className="detail-image" />
        <div className="detail-content">
          <span className="status-badge">ACTIVE</span>
          <h1 className="detail-title">{hall.name}</h1>
          <p className="detail-copy">{hall.description}</p>
          <p className="detail-meta">Capacity: {hall.capacity}</p>
          <div className="feature-list">
            {hall.features.map((feature) => (
              <span key={feature} className="feature-tag">
                {feature}
              </span>
            ))}
          </div>
          <div className="detail-actions">
            <Link to="/" className="btn btn-light">Back</Link>
            <Link to={`/availability/${hall.id}`} className="btn btn-primary">View Availability</Link>
          </div>

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
            <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Check Booked Slots</p>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => { setDate(e.target.value); fetchBooked(e.target.value) }}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.9rem', color: '#0f172a', background: '#f8fafc' }}
            />
            {date && (
              <div style={{ marginTop: '0.75rem' }}>
                {loading ? (
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading...</p>
                ) : bookedSlots.length === 0 ? (
                  <p style={{ color: '#15803d', fontSize: '0.85rem' }}>✅ No booked slots on this date.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {bookedSlots.map(s => (
                      <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.85rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.5rem' }}>
                        <span style={{ color: '#b91c1c', fontWeight: 600, fontSize: '0.9rem' }}>🔒 {s.timeSlot}</span>
                        <span style={{ fontSize: '0.72rem', color: '#b91c1c', background: '#fee2e2', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 700 }}>Booked</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </article>
    </main>
  )
}

export default HallDetailsPage
