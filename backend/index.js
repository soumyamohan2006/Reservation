
import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import pinoHttp from 'pino-http'
import { logger } from './utils/logger.js'

// Import Configurations & Jobs
import { connectDB } from './config/db.js'
import { initSlotCleanup } from './jobs/slotCleanup.js'

// Import Routes
import authRoutes from './routes/auth.js'
import hallRoutes from './routes/halls.js'
import slotRoutes from './routes/slots.js'
import bookingRoutes from './routes/bookings.js'
import userRoutes from './routes/users.js'
import publicRoutes from './routes/public.js'

// Initialize App
const app = express()
const PORT = process.env.PORT || 4000

// Connect to Database
connectDB()

// Initialize Background Jobs
initSlotCleanup()

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://10.91.255.232:5173', process.env.FRONTEND_URL] }))
app.use(express.json())
app.use(pinoHttp({ logger }))

// Mount Routes
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'reservation-backend' }))
app.use('/api', publicRoutes)
app.use('/api', authRoutes)
app.use('/api/halls', hallRoutes)
app.use('/api/slots', slotRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/users', userRoutes)

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled Exception Caught')
  
  if (err.name === 'ValidationError' || err.name === 'ZodError') {
    return res.status(400).json({ message: 'Validation Error', details: err.errors || err.message })
  }
  
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate Entity Error', details: Object.keys(err.keyValue) })
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// Start Server
app.listen(PORT, () => {
  logger.info(`Backend running aggressively on http://localhost:${PORT}`)
})
