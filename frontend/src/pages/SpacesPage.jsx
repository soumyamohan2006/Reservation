import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'

function SpacesPage({ halls }) {
  const { hallId } = useParams()
  const hall = halls.find((h) => h.id === hallId)
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    if (!hallId) return
    api.getGlobalBookings(hallId)
      .then(setBookings)
      .catch(() => setBookings([]))
  }, [hallId])

  const groupedByDate = bookings.reduce((acc, b) => {
    if (!acc[b.date]) acc[b.date] = []
    acc[b.date].push(`${b.startTime}-${b.endTime}`)
    return acc
  }, {})

  return (
    <main className="spaces-page">
      <section className="spaces-intro">
        <h1 className="spaces-title">{hall ? `${hall.name} Availability` : 'Availability'}</h1>
      </section>

      <section className="spaces-list">
        {hall ? (
          <article className="space-card">
            <div className="space-card-head">
              <h2 className="space-name">{hall.name}</h2>
              <Link to={`/book/${hall.id}`} className="btn btn-primary">
                Book now
              </Link>
            </div>

            <div className="availability-calendar" aria-label={`${hall.name} availability`}>
              {Object.keys(groupedByDate).length === 0 ? (
                <p className="calendar-empty">No bookings found for this space.</p>
              ) : Object.entries(groupedByDate).map(([date, slots]) => (
                <div key={date} className="calendar-row">
                  <p className="calendar-date">{date}</p>
                  <div className="calendar-slots">
                    <span className="calendar-label">Booked:</span>
                    {slots.map((slot) => (
                      <span key={slot} className="slot-pill slot-pill-taken">{slot}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ) : (
          <p className="calendar-empty">Space not found.</p>
        )}
      </section>
    </main>
  )
}

export default SpacesPage
