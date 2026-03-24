import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import hallRoutes from './routes/halls.js'
import slotRoutes from './routes/slots.js'
import bookingRoutes from './routes/bookings.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'] }))
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
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  })
