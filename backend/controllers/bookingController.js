import Booking from '../models/Booking.js'
import Slot from '../models/Slot.js'
import Hall from '../models/Hall.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import { sendMail } from '../utils/mailer.js'

// GET /api/bookings/my — user views their own bookings
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('hallId', 'name')
      .populate('slotId', 'date timeSlot')
      .sort({ createdAt: -1 })
    return res.json(bookings)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

// DELETE /api/bookings/:id — user cancels their own pending booking
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found.' })
    if (booking.userId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized.' })
    if (booking.status !== 'Pending')
      return res.status(400).json({ message: 'Only pending bookings can be cancelled.' })
    await Booking.findByIdAndDelete(req.params.id)
    return res.json({ message: 'Booking cancelled.' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

// POST /api/bookings — user requests a booking
export const createBooking = async (req, res) => {
  const { hallId, slotId, message } = req.body
  if (!hallId || !slotId)
    return res.status(400).json({ message: 'hallId and slotId are required.' })

  try {
    const slot = await Slot.findById(slotId).populate({ path: 'hallId', populate: { path: 'custodianId', select: 'name email' } })
    if (!slot) return res.status(404).json({ message: 'Slot not found.' })

    if (slot.isBooked)
      return res.status(409).json({ message: 'Slot is already booked.' })

    const booking = await Booking.create({
      userId: req.user.id,
      hallId,
      slotId,
      message: message || '',
    })

    await Notification.create({
      toRole: 'custodian',
      message: `New booking request (ID: ${booking._id}) is awaiting approval.`,
      bookingId: booking._id,
    })

    // Email custodian about new booking request
    const user = await User.findById(req.user.id, 'name email role')
    const hallName = slot.hallId?.name || 'Hall'
    const custodian = slot.hallId?.custodianId
    const custodianEmail = custodian?.email || process.env.CUSTODIAN_EMAIL
    const bookingRef = `BK${booking._id.toString().slice(-4).toUpperCase()}`
    const base = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/booking-action/${booking._id}?token=${process.env.ACTION_SECRET}`
    const requestedOn = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
    const roleLabel = user.role === 'student' ? 'Student' : user.role === 'faculty' ? 'Faculty' : user.role === 'user' ? 'Student' : user.role.charAt(0).toUpperCase() + user.role.slice(1)
    const [msgEvent, msgTime] = (message || '').split('|').map(s => s.trim())
    
    try {
      await sendMail({
        to: custodianEmail,
        subject: `New Booking Request — ${bookingRef}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:0.75rem;overflow:hidden">
            <div style="background:#1e3a8a;padding:1.25rem 1.5rem">
              <h2 style="color:#fff;margin:0;font-size:1.1rem">📋 New Hall Booking Request</h2>
            </div>
            <div style="padding:1.5rem">

              <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
                <tr>
                  <td style="padding:0.55rem 0;color:#64748b;width:40%;vertical-align:top">Booking ID</td>
                  <td style="padding:0.55rem 0;font-weight:700;color:#1e3a8a;font-size:1rem;letter-spacing:0.05em">${bookingRef}</td>
                </tr>
                <tr><td colspan="2" style="border-top:1px solid #f1f5f9;padding:0"></td></tr>

                <tr>
                  <td style="padding:0.55rem 0;color:#64748b;vertical-align:top">Requested by</td>
                  <td style="padding:0.55rem 0;font-weight:600;color:#0f172a">${user.name}</td>
                </tr>
                <tr>
                  <td style="padding:0.55rem 0;color:#64748b;vertical-align:top">Email</td>
                  <td style="padding:0.55rem 0;color:#0f172a">${user.email}</td>
                </tr>
                <tr><td colspan="2" style="border-top:1px solid #f1f5f9;padding:0.3rem 0"></td></tr>

                <tr>
                  <td style="padding:0.55rem 0;color:#64748b;vertical-align:top">Facility</td>
                  <td style="padding:0.55rem 0;font-weight:600;color:#0f172a">${hallName}</td>
                </tr>
                ${msgEvent ? `<tr>
                  <td style="padding:0.55rem 0;color:#64748b;vertical-align:top">Event Name</td>
                  <td style="padding:0.55rem 0;font-weight:600;color:#0f172a">${msgEvent}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding:0.55rem 0;color:#64748b;vertical-align:top">Requested Date</td>
                  <td style="padding:0.55rem 0;font-weight:600;color:#0f172a">${slot.date}</td>
                </tr>
                <tr>
                  <td style="padding:0.55rem 0;color:#64748b;vertical-align:top">Available Slot</td>
                  <td style="padding:0.55rem 0;color:#0f172a">${slot.timeSlot}</td>
                </tr>
                <tr>
                  <td style="padding:0.55rem 0;color:#64748b;vertical-align:top">Requested Time</td>
                  <td style="padding:0.55rem 0;font-weight:600;color:#0f172a">${msgTime || message || 'N/A'}</td>
                </tr>
                <tr><td colspan="2" style="border-top:1px solid #f1f5f9;padding:0.3rem 0"></td></tr>

                <tr>
                  <td style="padding:0.55rem 0;color:#64748b;vertical-align:top">Role</td>
                  <td style="padding:0.55rem 0;color:#0f172a">${roleLabel}</td>
                </tr>
                <tr>
                  <td style="padding:0.55rem 0;color:#64748b;vertical-align:top">Requested On</td>
                  <td style="padding:0.55rem 0;color:#0f172a">${requestedOn}</td>
                </tr>
              </table>

              <div style="margin-top:1.75rem;display:flex;gap:0.75rem">
                <a href="${base}&status=Approved"
                  style="flex:1;text-align:center;padding:0.7rem 1rem;background:#16a34a;color:#fff;text-decoration:none;border-radius:0.5rem;font-weight:700;font-size:0.95rem">
                  ✅ Approve
                </a>
                <a href="${base}&status=Rejected"
                  style="flex:1;text-align:center;padding:0.7rem 1rem;background:#dc2626;color:#fff;text-decoration:none;border-radius:0.5rem;font-weight:700;font-size:0.95rem">
                  ❌ Reject
                </a>
              </div>

              <p style="color:#94a3b8;font-size:0.72rem;margin-top:1.25rem;text-align:center">${bookingRef} · Campus Hall Booking System</p>
            </div>
          </div>
        `,
      })
      booking.emailSentToCustodian = true
      await booking.save()
    } catch (err) {
      console.error('Custodian email error:', err.message)
      booking.emailError = `Custodian email failed: ${err.message}`
      await booking.save()
    }

    return res.status(201).json(booking)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

// GET /api/bookings — custodian/admin views all bookings
export const getAllBookings = async (_req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('hallId', 'name')
      .populate('slotId', 'date timeSlot')
      .sort({ createdAt: -1 })
    return res.json(bookings)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

// GET /api/bookings/custodian — custodian views only their hall bookings
export const getCustodianBookings = async (req, res) => {
  try {
    const halls = await Hall.find({ custodianId: req.user.id })
    const hallIds = halls.map(h => h._id)
    const bookings = await Booking.find({ hallId: { $in: hallIds } })
      .populate('userId', 'name email')
      .populate('hallId', 'name')
      .populate('slotId', 'date timeSlot')
      .sort({ createdAt: -1 })
    return res.json(bookings)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

// PUT /api/bookings/:id — custodian/admin approves or rejects
export const updateBookingStatus = async (req, res) => {
  const { status } = req.body
  if (!['Approved', 'Rejected'].includes(status))
    return res.status(400).json({ message: 'status must be Approved or Rejected.' })

  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('hallId', 'name')
      .populate('slotId', 'date timeSlot')
    if (!booking) return res.status(404).json({ message: 'Booking not found.' })

    booking.status = status
    await booking.save()

    if (status === 'Approved') {
      await Slot.findByIdAndUpdate(booking.slotId, { isBooked: true })

      // Split remaining time into new available slot(s)
      try {
        const slot = await Slot.findById(booking.slotId)
        const msgTime = (booking.message || '').split('|').pop().replace('Time needed:', '').trim()
        console.log('Split debug — message:', booking.message)
        console.log('Split debug — msgTime:', msgTime)

        const toMin = (t) => {
          if (!t) return 0
          t = t.trim()
          if (/^\d{1,2}:\d{2}$/.test(t)) {
            const [h, m] = t.split(':').map(Number)
            return h * 60 + m
          }
          const mt = t.match(/^(\d+)(?::(\d+))?(AM|PM)$/i)
          if (!mt) return 0
          let h = parseInt(mt[1]), m = parseInt(mt[2] || 0)
          const p = mt[3].toUpperCase()
          if (p === 'PM' && h !== 12) h += 12
          if (p === 'AM' && h === 12) h = 0
          return h * 60 + m
        }

        const toLabel = (min) => {
          let h = Math.floor(min / 60), m = min % 60
          const p = h >= 12 ? 'PM' : 'AM'
          if (h > 12) h -= 12
          if (h === 0) h = 12
          return m === 0 ? `${h}${p}` : `${h}:${String(m).padStart(2, '0')}${p}`
        }

        // Split timeSlot on the dash between two time labels e.g. "8AM-10PM"
        const slotParts = slot.timeSlot.match(/^(.+?)-(.+)$/)
        const timeMatch = msgTime.match(/([\d]{1,2}(?::\d{2})?(?:AM|PM)?)\s*[–\-]\s*([\d]{1,2}(?::\d{2})?(?:AM|PM)?)/i)
        console.log('Split debug — slotParts:', slotParts)
        console.log('Split debug — timeMatch:', timeMatch)

        if (slot && slotParts && timeMatch) {
          const slotStart = toMin(slotParts[1])
          const slotEnd = toMin(slotParts[2])
          const bookedStart = toMin(timeMatch[1])
          const bookedEnd = toMin(timeMatch[2])
          console.log(`slotStart=${slotStart} slotEnd=${slotEnd} bookedStart=${bookedStart} bookedEnd=${bookedEnd}`)

          if (bookedStart > slotStart) {
            const ts = `${toLabel(slotStart)}-${toLabel(bookedStart)}`
            console.log('Creating before slot:', ts)
            await Slot.findOneAndUpdate(
              { hallId: slot.hallId, date: slot.date, timeSlot: ts },
              { hallId: slot.hallId, date: slot.date, timeSlot: ts, isBooked: false },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            )
          }
          if (bookedEnd < slotEnd) {
            const ts = `${toLabel(bookedEnd)}-${toLabel(slotEnd)}`
            console.log('Creating after slot:', ts)
            await Slot.findOneAndUpdate(
              { hallId: slot.hallId, date: slot.date, timeSlot: ts },
              { hallId: slot.hallId, date: slot.date, timeSlot: ts, isBooked: false },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            )
          }
        }
      } catch (splitErr) {
        console.error('Slot split error:', splitErr.message)
      }
        const bookingRef = `BK${booking._id.toString().slice(-4).toUpperCase()}`
        const [msgEvent, msgTimeNeeded] = (booking.message || '').split('|').map(s => s.trim())
        const exactTime = msgTimeNeeded ? msgTimeNeeded.replace('Time needed:', '').trim() : booking.slotId?.timeSlot
        try {
        await sendMail({
          to: booking.userId.email,
          subject: `Your Booking ${bookingRef} Has Been Approved`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:0.75rem;overflow:hidden">
              <div style="background:#16a34a;padding:1.25rem 1.5rem">
                <h2 style="color:#fff;margin:0;font-size:1.1rem">✅ Booking Approved!</h2>
              </div>
              <div style="padding:1.5rem">
                <div style="display:inline-block;background:#f0fdf4;border:1px solid #86efac;border-radius:0.5rem;padding:0.6rem 1rem;margin-bottom:1.25rem">
                  <span style="color:#64748b;font-size:0.75rem;font-weight:600;display:block">BOOKING ID</span>
                  <span style="color:#16a34a;font-size:1.3rem;font-weight:800;letter-spacing:0.05em">${bookingRef}</span>
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
                    <td style="padding:0.55rem 0;font-weight:600;color:#0f172a">${msgEvent || '—'}</td>
                  </tr>
                  <tr>
                    <td style="padding:0.55rem 0;color:#64748b">Time Needed</td>
                    <td style="padding:0.55rem 0;font-weight:600;color:#0f172a">${exactTime}</td>
                  </tr>
                </table>
                <p style="color:#94a3b8;font-size:0.72rem;margin-top:1.25rem">Booking ID ${bookingRef} · Campus Hall Booking System</p>
              </div>
            </div>
          `,
        })
        booking.emailSentToUser = true
        await booking.save()
      } catch (err) {
        console.error('User approval email error:', err.message)
        booking.emailError = booking.emailError ? `${booking.emailError}; User email failed: ${err.message}` : `User email failed: ${err.message}`
        await booking.save()
      }
    }

    await Notification.create({
      toRole: 'admin',
      message: `Booking (ID: ${booking._id}) has been ${status} by custodian.`,
      bookingId: booking._id,
    })

    return res.json({ message: `Booking ${status}.`, booking })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}
