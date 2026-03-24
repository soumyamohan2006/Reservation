import { Router } from 'express'
import Space from '../models/Space.js'
import Booking from '../models/Booking.js'

const router = Router()

// GET /api/spaces
router.get('/', async (_req, res) => {
  try {
    const spaces = await Space.find()
    res.json(spaces)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/spaces/:hallId/availability?date=YYYY-MM-DD
router.get('/:hallId/availability', async (req, res) => {
  const { hallId } = req.params
  const { date } = req.query
  try {
    const space = await Space.findOne({ hallId })
    if (!space) return res.status(404).json({ message: 'Space not found' })

    const filter = { hallId }
    if (date) filter.date = date

    const bookings = await Booking.find(filter)
    const takenSlots = bookings.map((b) => `${b.startTime}-${b.endTime}`)

    return res.json({ hallId, date: date || null, takenSlots, bookings })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

export default router
