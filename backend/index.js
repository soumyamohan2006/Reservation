import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import hallRoutes from './routes/halls.js'
import slotRoutes from './routes/slots.js'
import bookingRoutes from './routes/bookings.js'
import userRoutes from './routes/users.js'
import { parseTimeRange, toLabel, toMinutes } from './utils/bookingTime.js'

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

    const actor = req.query.actor || 'custodian'
    const isPrincipalAction = actor === 'principal'

    // Custodian action: must be Pending or already Approved (for re-split)
    const alreadyApproved = !isPrincipalAction && booking.status === 'Approved'
    if (!isPrincipalAction && booking.status !== 'Pending' && !alreadyApproved)
      return res.send(`<h2>Booking already ${booking.status}. ${booking.requiresPrincipalApproval && booking.status === 'CustodianApproved' ? 'Awaiting Principal approval.' : ''}</h2>`)

    // Principal action: must be CustodianApproved
    if (isPrincipalAction && booking.status !== 'CustodianApproved')
      return res.send(`<h2>Booking is ${booking.status}. No action needed.</h2>`)

    if (!alreadyApproved) {
      booking.status = status
      await booking.save()
    }

    if (status === 'Approved') {
      // Custodian approving a principal-required booking → escalate
      if (!isPrincipalAction && booking.requiresPrincipalApproval) {
        booking.status = 'CustodianApproved'
        await booking.save()
        // Email principal
        const principalEmail = process.env.PRINCIPAL_EMAIL
        if (principalEmail) {
          const bookingRef2 = `BK${booking._id.toString().slice(-4).toUpperCase()}`
          const base2 = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/booking-action/${booking._id}?token=${process.env.ACTION_SECRET}&actor=principal`
          const [msgEvent2, msgTime2] = (booking.message || '').split('|').map(s => s.trim())
          try {
            await sendMail({
              to: principalEmail,
              subject: `Final Approval Required — ${bookingRef2}`,
              html: `
                <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:0.75rem;overflow:hidden">
                  <div style="background:#7c3aed;padding:1.25rem 1.5rem"><h2 style="color:#fff;margin:0;font-size:1.1rem">🏛️ Final Approval Required</h2></div>
                  <div style="padding:1.5rem">
                    <p style="color:#1e293b;margin:0 0 1rem">The custodian has approved this booking. Your final approval is required.</p>
                    <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
                      <tr><td style="padding:0.5rem 0;color:#64748b;width:40%">Booking ID</td><td style="padding:0.5rem 0;font-weight:700;color:#7c3aed">${bookingRef2}</td></tr>
                      <tr><td style="padding:0.5rem 0;color:#64748b">Requested by</td><td style="padding:0.5rem 0;font-weight:600">${booking.userId?.name} (${booking.userId?.email})</td></tr>
                      <tr><td style="padding:0.5rem 0;color:#64748b">Facility</td><td style="padding:0.5rem 0;font-weight:600">${booking.hallId?.name}</td></tr>
                      <tr><td style="padding:0.5rem 0;color:#64748b">Event Type</td><td style="padding:0.5rem 0;font-weight:600">${booking.eventType}</td></tr>
                      ${msgEvent2 ? `<tr><td style="padding:0.5rem 0;color:#64748b">Event Name</td><td style="padding:0.5rem 0;font-weight:600">${msgEvent2}</td></tr>` : ''}
                      <tr><td style="padding:0.5rem 0;color:#64748b">Date</td><td style="padding:0.5rem 0;font-weight:600">${booking.slotId?.date}</td></tr>
                      <tr><td style="padding:0.5rem 0;color:#64748b">Time Slot</td><td style="padding:0.5rem 0">${booking.slotId?.timeSlot}</td></tr>
                      <tr><td style="padding:0.5rem 0;color:#64748b">Requested Time</td><td style="padding:0.5rem 0;font-weight:600">${msgTime2 || 'N/A'}</td></tr>
                    </table>
                    <div style="margin-top:1.75rem;display:flex;gap:0.75rem">
                      <a href="${base2}&status=Approved" style="flex:1;text-align:center;padding:0.7rem 1rem;background:#16a34a;color:#fff;text-decoration:none;border-radius:0.5rem;font-weight:700">✅ Final Approve</a>
                      <a href="${base2}&status=Rejected" style="flex:1;text-align:center;padding:0.7rem 1rem;background:#dc2626;color:#fff;text-decoration:none;border-radius:0.5rem;font-weight:700">❌ Reject</a>
                    </div>
                  </div>
                </div>`,
            })
          } catch (e) { console.error('Principal email error:', e.message) }
        }
        return res.send(`<html><body style="font-family:Arial;text-align:center;padding:3rem"><h1 style="color:#7c3aed">⏳ Escalated to Principal</h1><p>Booking <b>BK${booking._id.toString().slice(-4).toUpperCase()}</b> has been forwarded to the Principal for final approval.</p></body></html>`)
      }

      const rawSlotId = booking.slotId?._id || booking.slotId
      await Slot.findByIdAndUpdate(rawSlotId, { isBooked: true })

      // Split remaining time into new available slot(s)
      try {
        const slot = await Slot.findById(rawSlotId)
        const timeRange = parseTimeRange(booking.message)
        const MIN_SUB_SLOT_MINUTES = 180

        console.log('Email split debug:', { rawSlotId: rawSlotId?.toString(), timeRange, timeSlot: slot?.timeSlot, message: booking.message })

        if (slot && timeRange) {
          const slotParts = slot.timeSlot.match(/^(.+?)-(.+)$/)
          if (slotParts) {
            const slotStart = toMinutes(slotParts[1]), slotEnd = toMinutes(slotParts[2])
            const bookedStart = toMinutes(timeRange.start), bookedEnd = toMinutes(timeRange.end)
            console.log('Email split times:', { slotStart, slotEnd, bookedStart, bookedEnd })

            const bookedTs = `${toLabel(bookedStart)}-${toLabel(bookedEnd)}`
            await Slot.findByIdAndUpdate(rawSlotId, { timeSlot: bookedTs, isBooked: true })
            console.log('Email split: updated slot to', bookedTs)

            if (bookedStart > slotStart && (bookedStart - slotStart) > MIN_SUB_SLOT_MINUTES) {
              const ts = `${toLabel(slotStart)}-${toLabel(bookedStart)}`
              await Slot.findOneAndUpdate({ hallId: slot.hallId, date: slot.date, timeSlot: ts }, { hallId: slot.hallId, date: slot.date, timeSlot: ts, isBooked: false }, { upsert: true, new: true, setDefaultsOnInsert: true })
              console.log('Email split: created before sub-slot:', ts)
            }
            if (bookedEnd < slotEnd && (slotEnd - bookedEnd) > MIN_SUB_SLOT_MINUTES) {
              const ts = `${toLabel(bookedEnd)}-${toLabel(slotEnd)}`
              await Slot.findOneAndUpdate({ hallId: slot.hallId, date: slot.date, timeSlot: ts }, { hallId: slot.hallId, date: slot.date, timeSlot: ts, isBooked: false }, { upsert: true, new: true, setDefaultsOnInsert: true })
              console.log('Email split: created after sub-slot:', ts)
            }
          } else {
            console.log('Email split: slot.timeSlot format not matched:', slot.timeSlot)
          }
        } else {
          console.log('Email split skipped:', { hasSlot: !!slot, hasTimeRange: !!timeRange })
        }
      } catch (splitErr) {
        console.error('Slot split error:', splitErr.message)
      }

      try {
        await sendMail({
          to: booking.userId.email,
          subject: 'Your Hall Booking Has Been Approved',
          html: (() => {
          const bookingRef2 = `BK${booking._id.toString().slice(-4).toUpperCase()}`
          const [msgEvent2, msgTimeNeeded2] = (booking.message || '').split('|').map(s => s.trim())
          const exactTime2 = msgTimeNeeded2 ? msgTimeNeeded2.replace('Time needed:', '').trim() : booking.slotId?.timeSlot
          return `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:0.75rem;overflow:hidden">
              <div style="background:#16a34a;padding:1.25rem 1.5rem">
                <h2 style="color:#fff;margin:0;font-size:1.1rem">✅ Booking Approved!</h2>
              </div>
              <div style="padding:1.5rem">
                <div style="display:inline-block;background:#f0fdf4;border:1px solid #86efac;border-radius:0.5rem;padding:0.6rem 1rem;margin-bottom:1.25rem">
                  <span style="color:#64748b;font-size:0.75rem;font-weight:600;display:block">BOOKING ID</span>
                  <span style="color:#16a34a;font-size:1.3rem;font-weight:800;letter-spacing:0.05em">${bookingRef2}</span>
                </div>
                <p style="color:#1e293b;margin:0 0 1.25rem">Hi <b>${booking.userId.name}</b>, your booking has been <b style="color:#16a34a">approved</b> by the custodian.</p>
                <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
                  <tr style="border-bottom:1px solid #f1f5f9">
                    <td style="padding:0.55rem 0;color:#64748b;width:40%">Hall</td>
                    <td style="padding:0.55rem 0;font-weight:600;color:#0f172a">${booking.hallId?.name}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9">
                    <td style="padding:0.55rem 0;color:#64748b">Date</td>
                    <td style="padding:0.55rem 0;font-weight:600;color:#0f172a">${booking.slotId?.date}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9">
                    <td style="padding:0.55rem 0;color:#64748b">Event</td>
                    <td style="padding:0.55rem 0;font-weight:600;color:#0f172a">${msgEvent2 || '—'}</td>
                  </tr>
                  <tr>
                    <td style="padding:0.55rem 0;color:#64748b">Time Needed</td>
                    <td style="padding:0.55rem 0;font-weight:600;color:#0f172a">${exactTime2}</td>
                  </tr>
                </table>
                <p style="color:#94a3b8;font-size:0.72rem;margin-top:1.25rem">Booking ID ${bookingRef2} · Campus Hall Booking System</p>
              </div>
            </div>
          `
        })(),
      })
      console.log('✅ User approval email sent to:', booking.userId.email)
    } catch (emailErr) {
      console.error('❌ Approval email error:', emailErr.message)
    }
    }

    const color = status === 'Approved' ? '#16a34a' : '#dc2626'
    const icon = status === 'Approved' ? '✅' : '❌'
    const bookingRef = `BK${booking._id.toString().slice(-4).toUpperCase()}`
    const approvedBy = isPrincipalAction ? 'Principal' : 'Custodian'
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
            ${icon} This booking has been <b>${status}</b> by ${approvedBy}
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
    console.log('Connected to MongoDB:', process.env.MONGO_URI?.split('@')[1] || 'database')
    
    // Log existing data counts
    const User = (await import('./models/User.js')).default
    const Hall = (await import('./models/Hall.js')).default
    const Slot = (await import('./models/Slot.js')).default
    const Booking = (await import('./models/Booking.js')).default
    
    // const counts = {
    //   users: await User.countDocuments(),
    //   halls: await Hall.countDocuments(),
    //   slots: await Slot.countDocuments(),
    //   bookings: await Booking.countDocuments()
    // }
    // console.log('Database counts on startup:', counts)

    // Seed admin if not exists
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL })
    if (!adminExists) {
      await User.create({ name: 'Admin', email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, role: 'admin' })
      console.log(`Admin seeded: ${process.env.ADMIN_EMAIL}`)
    }

    // Seed custodian if not exists
    const custodianExists = await User.findOne({ email: process.env.CUSTODIAN_EMAIL })
    if (!custodianExists) {
      await User.create({ name: 'Custodian', email: process.env.CUSTODIAN_EMAIL, password: process.env.CUSTODIAN_PASSWORD, role: 'custodian' })
      console.log(`Custodian seeded: ${process.env.CUSTODIAN_EMAIL}`)
    }

    // Seed principal if not exists
    const principalExists = await User.findOne({ email: process.env.PRINCIPAL_EMAIL })
    if (!principalExists && process.env.PRINCIPAL_EMAIL) {
      await User.create({ name: 'Principal', email: process.env.PRINCIPAL_EMAIL, password: process.env.PRINCIPAL_PASSWORD, role: 'principal' })
      console.log(`Principal seeded: ${process.env.PRINCIPAL_EMAIL}`)
    }

    app.listen(PORT, async () => {
      console.log(`Backend running on http://localhost:${PORT}`)
      // Delete past unbooked slots on startup
      const today = new Date().toISOString().split('T')[0]
      const { deletedCount } = await (await import('./models/Slot.js')).default.deleteMany({ isBooked: false, date: { $lt: today } })
      if (deletedCount > 0) console.log(`Cleaned up ${deletedCount} past unbooked slot(s).`)
    })
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  })

  mongoose.connection.once('open', () => {
      console.log('MongoDB Connected to:', mongoose.connection.name);
    });
