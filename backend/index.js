import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import hallRoutes from './routes/halls.js'
import slotRoutes from './routes/slots.js'
import bookingRoutes from './routes/bookings.js'
import userRoutes from './routes/users.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://10.91.255.232:5173', process.env.FRONTEND_URL] }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'reservation-backend' }))

app.get('/api/test-email', async (_req, res) => {
  const { sendMail } = await import('./utils/mailer.js')
  try {
    const response =await sendMail({
      to: process.env.CUSTODIAN_EMAIL,
      subject: 'Test Email',
      html: '<p>Email is working!</p>',
    })
    console.log(response)
    res.json({ ok: true, message: `Email sent to ${process.env.CUSTODIAN_EMAIL}` })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.use('/api', authRoutes)
app.use('/api/halls', hallRoutes)
app.use('/api/slots', slotRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/users', userRoutes)

// Public email action route — approve/reject from email link
app.get('/api/booking-action/:id', async (req, res) => {
  const { status, token } = req.query
  if (!['Approved', 'Rejected'].includes(status) || token !== process.env.ACTION_SECRET)
    return res.status(403).send('<h2>Invalid or expired link.</h2>')

  try {
    const Booking = (await import('./models/Booking.js')).default
    const Slot = (await import('./models/Slot.js')).default
    const User = (await import('./models/User.js')).default
    const { sendMail } = await import('./utils/mailer.js')

    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('hallId', 'name')
      .populate('slotId', 'date timeSlot')
    if (!booking) return res.status(404).send('<h2>Booking not found.</h2>')
    if (booking.status !== 'Pending') return res.send(`<h2>Booking already ${booking.status}.</h2>`)

    booking.status = status
    await booking.save()

    if (status === 'Approved') {
      await Slot.findByIdAndUpdate(booking.slotId, { isBooked: true })

      // Split remaining time into new available slot(s)
      try {
        const slot = await Slot.findById(booking.slotId)
        const msgTime = (booking.message || '').split('|').pop().replace('Time needed:', '').trim()
        const toMin = (t) => {
          if (!t) return 0
          t = t.trim()
          if (/^\d{1,2}:\d{2}$/.test(t)) { const [h, m] = t.split(':').map(Number); return h * 60 + m }
          const mt = t.match(/^(\d+)(?::(\d+))?(AM|PM)$/i); if (!mt) return 0
          let h = parseInt(mt[1]), m = parseInt(mt[2] || 0); const p = mt[3].toUpperCase()
          if (p === 'PM' && h !== 12) h += 12; if (p === 'AM' && h === 12) h = 0
          return h * 60 + m
        }
        const toLabel = (min) => {
          let h = Math.floor(min / 60), m = min % 60; const p = h >= 12 ? 'PM' : 'AM'
          if (h > 12) h -= 12; if (h === 0) h = 12
          return m === 0 ? `${h}${p}` : `${h}:${String(m).padStart(2, '0')}${p}`
        }
        const slotParts = slot.timeSlot.match(/^(.+?)-(.+)$/)
        const timeMatch = msgTime.match(/(\d{1,2}(?::\d{2})?(?:AM|PM)?)\s*[\u2013\-]\s*(\d{1,2}(?::\d{2})?(?:AM|PM)?)/i)
        if (slot && slotParts && timeMatch) {
          const slotStart = toMin(slotParts[1]), slotEnd = toMin(slotParts[2])
          const bookedStart = toMin(timeMatch[1]), bookedEnd = toMin(timeMatch[2])
          if (bookedStart > slotStart) {
            const ts = `${toLabel(slotStart)}-${toLabel(bookedStart)}`
            await Slot.findOneAndUpdate({ hallId: slot.hallId, date: slot.date, timeSlot: ts }, { hallId: slot.hallId, date: slot.date, timeSlot: ts, isBooked: false }, { upsert: true, new: true, setDefaultsOnInsert: true })
          }
          if (bookedEnd < slotEnd) {
            const ts = `${toLabel(bookedEnd)}-${toLabel(slotEnd)}`
            await Slot.findOneAndUpdate({ hallId: slot.hallId, date: slot.date, timeSlot: ts }, { hallId: slot.hallId, date: slot.date, timeSlot: ts, isBooked: false }, { upsert: true, new: true, setDefaultsOnInsert: true })
          }
        }
      } catch (splitErr) {
        console.error('Slot split error:', splitErr.message)
      }

      sendMail({
        to: booking.userId.email,
        subject: 'Your Hall Booking Has Been Approved',
        html: `
          <h3>Booking Approved!</h3>
          <p>Hi ${booking.userId.name},</p>
          <p>Your booking has been <b>approved</b> by the custodian.</p>
          <p><b>Hall:</b> ${booking.hallId?.name}</p>
          <p><b>Date:</b> ${booking.slotId?.date}</p>
          <p><b>Time Slot:</b> ${booking.slotId?.timeSlot}</p>
        `,
      }).catch(err => console.error('Approval email error:', err.message))
    }

    const color = status === 'Approved' ? '#16a34a' : '#dc2626'
    const icon = status === 'Approved' ? '✅' : '❌'
    const bookingRef = `BK${booking._id.toString().slice(-4).toUpperCase()}`
    return res.send(`
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="font-family:Arial,sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:1rem;padding:2.5rem 2rem;max-width:420px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          <div style="font-size:3rem;margin-bottom:1rem">${icon}</div>
          <h1 style="color:${color};margin:0 0 0.5rem;font-size:1.5rem">Booking ${status}!</h1>
          <div style="display:inline-block;background:#f1f5f9;border-radius:999px;padding:0.3rem 1rem;margin:0.75rem 0 1.25rem">
            <span style="color:#1e3a8a;font-weight:700;font-size:0.95rem">${bookingRef}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;text-align:left;font-size:0.9rem;margin-bottom:1.5rem">
            <tr style="border-bottom:1px solid #f1f5f9">
              <td style="padding:0.5rem 0;color:#64748b">Facility</td>
              <td style="padding:0.5rem 0;font-weight:600;color:#0f172a">${booking.hallId?.name}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9">
              <td style="padding:0.5rem 0;color:#64748b">Date</td>
              <td style="padding:0.5rem 0;font-weight:600;color:#0f172a">${booking.slotId?.date}</td>
            </tr>
            <tr>
              <td style="padding:0.5rem 0;color:#64748b">Time Slot</td>
              <td style="padding:0.5rem 0;font-weight:600;color:#0f172a">${booking.slotId?.timeSlot}</td>
            </tr>
          </table>
          <div style="padding:0.75rem 1rem;background:${status === 'Approved' ? '#f0fdf4' : '#fef2f2'};border:1px solid ${color};border-radius:0.5rem;color:${color};font-weight:700;font-size:0.95rem">
            ${icon} This booking has been <b>${status}</b>
          </div>
          <p style="color:#94a3b8;font-size:0.75rem;margin-top:1.25rem">You can close this tab.</p>
        </div>
      </body></html>
    `)
  } catch (err) {
    return res.status(500).send(`<h2>Error: ${err.message}</h2>`)
  }
})

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Internal server error.' })
})

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB')
    const Hall = (await import('./models/Hall.js')).default
    const User = (await import('./models/User.js')).default

    // Seed default halls
    const hallCount = await Hall.countDocuments()
    if (hallCount === 0) {
      await Hall.insertMany([
        { name: 'Auditorium', capacity: 500 },
        { name: 'Seminar Hall', capacity: 200 },
        { name: 'CGPC Hall', capacity: 50 },
      ])
      console.log('Default halls seeded.')
    }

    // Seed default admin account
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL })
    if (!adminExists) {
      await User.create({ name: 'Admin', email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, role: 'admin' })
      console.log(`Admin seeded: ${process.env.ADMIN_EMAIL}`)
    }

    // Seed default custodian account
    const custodianExists = await User.findOne({ email: process.env.CUSTODIAN_EMAIL })
    if (!custodianExists) {
      await User.create({ name: 'Custodian', email: process.env.CUSTODIAN_EMAIL, password: process.env.CUSTODIAN_PASSWORD, role: 'custodian' })
      console.log(`Custodian seeded: ${process.env.CUSTODIAN_EMAIL}`)
    }

    app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`))

    // Fix any slots where hallId is stored as a string instead of ObjectId
    const Slot = (await import('./models/Slot.js')).default
    const allHalls = await Hall.find()
    for (const hall of allHalls) {
      await Slot.collection.updateMany({ hallId: hall.name }, { $set: { hallId: hall._id } })
      await Slot.collection.updateMany({ hallId: hall.name.toLowerCase() }, { $set: { hallId: hall._id } })
    }
    const { ObjectId } = mongoose.Types
    const rawSlots = await Slot.collection.find({}).toArray()
    for (const s of rawSlots) {
      if (typeof s.hallId === 'string' && ObjectId.isValid(s.hallId)) {
        await Slot.collection.updateOne({ _id: s._id }, { $set: { hallId: new ObjectId(s.hallId) } })
      }
    }
    console.log('Hall ID fix applied.')

    // Delete past slots once on startup, then every day at midnight
    const deletePastSlots = async () => {
      const today = new Date().toISOString().split('T')[0]
      const result = await Slot.deleteMany({ date: { $lt: today } })
      if (result.deletedCount > 0) console.log(`Cleaned up ${result.deletedCount} past slot(s).`)
    }
    deletePastSlots()
    const now = new Date()
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0) - now
    setTimeout(() => { deletePastSlots(); setInterval(deletePastSlots, 24 * 60 * 60 * 1000) }, msUntilMidnight)
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  })
