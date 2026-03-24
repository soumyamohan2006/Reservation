import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const timeOptions = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

function ReservePage({ halls, setHeaderNotice }) {
  const { hallId } = useParams()
  const hall = halls.find((item) => item.id === hallId)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [organizer, setOrganizer] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [takenSlots, setTakenSlots] = useState([])
  const [bookingError, setBookingError] = useState('')

  useEffect(() => {
    if (!hallId || !date) return
    fetch(`http://localhost:4000/api/spaces/${hallId}/availability?date=${date}`)
      .then((r) => r.json())
      .then((data) => setTakenSlots(data.takenSlots || []))
      .catch(() => setTakenSlots([]))
  }, [hallId, date])

  const onConfirm = async () => {
    if (!date || !startTime || !endTime) {
      setBookingError('Please choose date, start time, and end time.')
      return
    }
    try {
      const res = await fetch('http://localhost:4000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hallId, date, startTime, endTime, organizer, eventTitle }),
      })
      const data = await res.json()
      if (!res.ok) { setBookingError(data.message); return }
      setBookingError('')
      setHeaderNotice('submitted')
    } catch {
      setBookingError('Server error. Is the backend running?')
    }
  }

  if (!hall) {
    return (
      <main className="subpage">
        <div className="detail-card">
          <div className="detail-content">
            <h1 className="detail-title">Hall not found</h1>
            <p className="detail-copy">Please return to catalog and choose a valid hall.</p>
            <div className="detail-actions">
              <Link to="/" className="btn btn-primary">Back to Catalog</Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="booking-page">
      <section className="booking-card">
        <h1 className="booking-title">Book {hall.name}</h1>
        <p className="booking-subtitle">Fill in the details to request a reservation.</p>

        <form className="booking-form">
          <div className="booking-two-col">
            <label className="form-field">
              Organizer
              <input type="text" placeholder="Your name" value={organizer} onChange={(e) => setOrganizer(e.target.value)} />
            </label>

            <label className="form-field">
              Department
              <select defaultValue="Computer Science" className="booking-select-dark">
                <option>Computer Science</option>
                <option>Electronics</option>
                <option>Mechanical</option>
                <option>Civil</option>
              </select>
            </label>
          </div>

          <label className="form-field form-span-full">
            Event Title
            <input type="text" placeholder="e.g. Annual General Meeting" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
          </label>

          <label className="form-field form-span-full">
            Description (Optional)
            <textarea rows="4" placeholder="Additional details about the event..." />
          </label>

          <label className="form-field form-span-full">
            Date
            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setBookingError('') }} />
          </label>

          <div className="booking-time-row">
            <label className="form-field">
              Start Time
              <select value={startTime} className="booking-select-dark" onChange={(e) => { setStartTime(e.target.value); setBookingError('') }}>
                <option value="" disabled>Select start time</option>
                {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            <label className="form-field">
              End Time
              <select value={endTime} className="booking-select-dark" onChange={(e) => { setEndTime(e.target.value); setBookingError('') }}>
                <option value="" disabled>Select end time</option>
                {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>

          {date && (
            <p className="taken-slots">
              Taken slots on {date}: {takenSlots.length ? takenSlots.join(', ') : 'None'}
            </p>
          )}
          {bookingError && <p className="booking-error">{bookingError}</p>}
        </form>

        <div className="booking-actions">
          <button type="button" className="btn btn-primary btn-confirm" onClick={onConfirm}>
            Confirm Booking
          </button>
        </div>
      </section>
    </main>
  )
}

export default ReservePage
