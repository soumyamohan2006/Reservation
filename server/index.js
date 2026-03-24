import cors from 'cors'
import express from 'express'
import { randomUUID } from 'node:crypto'

const app = express()
const PORT = process.env.PORT || 4000

const halls = [
  {
    id: 'cgpc-hall',
    name: 'Auditorium',
    capacity: 500,
    description: 'Meetings, workshops, presentations',
    features: ['Projector', 'Audio System', 'Stage', 'Control Room for Technical Support'],
  },
  {
    id: 'seminar-hall',
    name: 'Seminar Hall',
    capacity: 200,
    description: 'Seminars, conferences, guest lectures',
    features: ['Stage', 'Podium', 'Centralized AC', 'Professional Lighting'],
  },
  {
    id: 'asap-hall',
    name: 'CGPC Hall',
    capacity: 50,
    description: 'Training programs and academic sessions',
    features: ['Projector', 'AC', 'Wi-Fi', 'Audio System', 'Podium', 'Stage'],
  },
]

const bookings = [
  { id: 'b1', hallId: 'cgpc-hall', date: '2026-03-06', startTime: '09:00', endTime: '11:00' },
  { id: 'b2', hallId: 'cgpc-hall', date: '2026-03-06', startTime: '14:00', endTime: '16:00' },
  { id: 'b3', hallId: 'seminar-hall', date: '2026-03-08', startTime: '09:00', endTime: '11:00' },
  { id: 'b4', hallId: 'asap-hall', date: '2026-03-09', startTime: '10:00', endTime: '12:00' },
]

const users = []

app.use(cors({ origin: ['http://localhost:5173'] }))
app.use(express.json())

const toMinutes = (timeValue) => {
  const [hours, minutes] = timeValue.split(':').map(Number)
  return hours * 60 + minutes
}

const isOverlapping = (aStart, aEnd, bStart, bEnd) => {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd)
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'reservation-backend' })
})

// --- Auth ---

app.post('/api/register', (req, res) => {
  const { name, email, password, role } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required.' })
  }
  if (users.find((u) => u.email === email)) {
    return res.status(409).json({ message: 'Email already registered.' })
  }
  const user = { id: randomUUID(), name, email, password, role: role || 'Faculty' }
  users.push(user)
  return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role })
})

app.post('/api/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required.' })
  }
  const user = users.find((u) => u.email === email && u.password === password)
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' })
  }
  return res.json({ id: user.id, name: user.name, email: user.email, role: user.role })
})

// --- Spaces ---

app.get('/api/spaces', (_req, res) => {
  res.json(halls)
})

app.get('/api/spaces/:hallId/availability', (req, res) => {
  const { hallId } = req.params
  const { date } = req.query

  const hall = halls.find((item) => item.id === hallId)
  if (!hall) return res.status(404).json({ message: 'Space not found' })

  const hallBookings = bookings.filter(
    (b) => b.hallId === hallId && (!date || b.date === date),
  )
  const takenSlots = hallBookings.map((b) => `${b.startTime}-${b.endTime}`)

  return res.json({ hallId, date: date || null, takenSlots, bookings: hallBookings })
})

// --- Bookings ---

app.get('/api/bookings', (req, res) => {
  const { hallId, date } = req.query
  let result = [...bookings]
  if (hallId) result = result.filter((b) => b.hallId === hallId)
  if (date) result = result.filter((b) => b.date === date)
  res.json(result)
})

app.post('/api/bookings', (req, res) => {
  const { hallId, date, startTime, endTime, organizer = '', eventTitle = '' } = req.body

  if (!hallId || !date || !startTime || !endTime) {
    return res.status(400).json({ message: 'hallId, date, startTime and endTime are required.' })
  }
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    return res.status(400).json({ message: 'endTime must be later than startTime.' })
  }
  if (!halls.find((h) => h.id === hallId)) {
    return res.status(404).json({ message: 'Space not found' })
  }

  const hasConflict = bookings.some(
    (b) =>
      b.hallId === hallId &&
      b.date === date &&
      isOverlapping(startTime, endTime, b.startTime, b.endTime),
  )
  if (hasConflict) {
    return res.status(409).json({ message: 'Requested time overlaps an existing booking.' })
  }

  const booking = { id: randomUUID(), hallId, date, startTime, endTime, organizer, eventTitle, status: 'pending' }
  bookings.push(booking)
  return res.status(201).json(booking)
})

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
