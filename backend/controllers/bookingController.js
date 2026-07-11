import Booking from '../models/Booking.js'
import Slot from '../models/Slot.js'
import Hall from '../models/Hall.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import { sendMail } from '../utils/mailer.js'
import { parseTimeRange, toLabel, toMinutes } from '../utils/bookingTime.js'

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

// DELETE /api/bookings/:id — user cancels their own pending or approved booking
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found.' })
    if (booking.userId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized.' })
    if (booking.status === 'Rejected')
      return res.status(400).json({ message: 'Rejected bookings cannot be cancelled.' })
    if (booking.status === 'Approved' || booking.status === 'CustodianApproved')
      await Slot.findByIdAndUpdate(booking.slotId, { isBooked: false })
    await Booking.findByIdAndDelete(req.params.id)
    return res.json({ message: 'Booking cancelled.' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

const PRINCIPAL_APPROVAL_TYPES = ['Conference', 'Cultural Event', 'External Event']

// POST /api/bookings — user requests a booking
export const createBooking = async (req, res) => {
  const { hallId, slotId, message, eventType } = req.body
  if (!hallId || !slotId)
    return res.status(400).json({ message: 'hallId and slotId are required.' })

  try {
    const slot = await Slot.findById(slotId).populate({ path: 'hallId', populate: { path: 'custodianId', select: 'name email' } })
    if (!slot) return res.status(404).json({ message: 'Slot not found.' })

    if (slot.isBooked)
      return res.status(409).json({ message: 'Slot is already booked.' })

    const requiresPrincipalApproval = PRINCIPAL_APPROVAL_TYPES.includes(eventType)
    const booking = await Booking.create({
      userId: req.user.id,
      hallId,
      slotId,
      eventType: eventType || '',
      requiresPrincipalApproval,
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
    const msgSegments = (message || '').split('|').map(s => s.trim())
    const msgEvent = msgSegments[0] || ''
    const msgTime = msgSegments.find(s => /^time needed:/i.test(s)) || msgSegments[1] || ''
    
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
                <tr>
                  <td style="padding:0.55rem 0;color:#64748b;vertical-align:top">Event Type</td>
                  <td style="padding:0.55rem 0;font-weight:600;color:#0f172a">${eventType || '—'}</td>
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
                  <td style="padding:0.55rem 0;font-weight:600;color:#0f172a">${msgTime ? msgTime.replace(/^time needed:\s*/i, '') : message || 'N/A'}</td>
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
                ${requiresPrincipalApproval ? `<tr><td colspan="2" style="padding:0.55rem 0"><span style="background:#fef9c3;color:#92400e;padding:0.3rem 0.75rem;border-radius:999px;font-size:0.78rem;font-weight:700">⚠️ Requires Principal approval after your approval</span></td></tr>` : ''}
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

// Helper: email principal for final approval after custodian approves
const _sendPrincipalEmail = async (booking) => {
  const principalEmail = process.env.PRINCIPAL_EMAIL
  if (!principalEmail) return
  const bookingRef = `BK${booking._id.toString().slice(-4).toUpperCase()}`
  const base = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/booking-action/${booking._id}?token=${process.env.ACTION_SECRET}&actor=principal`
  const msgSegmentsPrincipal = (booking.message || '').split('|').map(s => s.trim())
  const msgEvent = msgSegmentsPrincipal[0] || ''
  const msgTime = msgSegmentsPrincipal.find(s => /^time needed:/i.test(s)) || ''
  try {
    await sendMail({
      to: principalEmail,
      subject: `Final Approval Required — ${bookingRef}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:0.75rem;overflow:hidden">
          <div style="background:#7c3aed;padding:1.25rem 1.5rem">
            <h2 style="color:#fff;margin:0;font-size:1.1rem">🏛️ Final Approval Required</h2>
          </div>
          <div style="padding:1.5rem">
            <p style="color:#1e293b;margin:0 0 1rem">The custodian has approved this booking. Your final approval is required.</p>
            <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
              <tr><td style="padding:0.5rem 0;color:#64748b;width:40%">Booking ID</td><td style="padding:0.5rem 0;font-weight:700;color:#7c3aed">${bookingRef}</td></tr>
              <tr><td style="padding:0.5rem 0;color:#64748b">Requested by</td><td style="padding:0.5rem 0;font-weight:600;color:#0f172a">${booking.userId?.name} (${booking.userId?.email})</td></tr>
              <tr><td style="padding:0.5rem 0;color:#64748b">Facility</td><td style="padding:0.5rem 0;font-weight:600;color:#0f172a">${booking.hallId?.name}</td></tr>
              <tr><td style="padding:0.5rem 0;color:#64748b">Event Type</td><td style="padding:0.5rem 0;font-weight:600;color:#0f172a">${booking.eventType}</td></tr>
              ${msgEvent ? `<tr><td style="padding:0.5rem 0;color:#64748b">Event Name</td><td style="padding:0.5rem 0;font-weight:600;color:#0f172a">${msgEvent}</td></tr>` : ''}
              <tr><td style="padding:0.5rem 0;color:#64748b">Date</td><td style="padding:0.5rem 0;font-weight:600;color:#0f172a">${booking.slotId?.date}</td></tr>
              <tr><td style="padding:0.5rem 0;color:#64748b">Time Slot</td><td style="padding:0.5rem 0;color:#0f172a">${booking.slotId?.timeSlot}</td></tr>
              <tr><td style="padding:0.5rem 0;color:#64748b">Requested Time</td><td style="padding:0.5rem 0;font-weight:600;color:#0f172a">${msgTime ? msgTime.replace(/^time needed:\s*/i, '') : 'N/A'}</td></tr>
            </table>
            <div style="margin-top:1.75rem;display:flex;gap:0.75rem">
              <a href="${base}&status=Approved" style="flex:1;text-align:center;padding:0.7rem 1rem;background:#16a34a;color:#fff;text-decoration:none;border-radius:0.5rem;font-weight:700;font-size:0.95rem">✅ Final Approve</a>
              <a href="${base}&status=Rejected" style="flex:1;text-align:center;padding:0.7rem 1rem;background:#dc2626;color:#fff;text-decoration:none;border-radius:0.5rem;font-weight:700;font-size:0.95rem">❌ Reject</a>
            </div>
            <p style="color:#94a3b8;font-size:0.72rem;margin-top:1.25rem;text-align:center">${bookingRef} · Campus Hall Booking System</p>
          </div>
        </div>
      `,
    })
    console.log(`📧 Principal approval email sent for ${bookingRef}`)
  } catch (err) {
    console.error('Principal email error:', err.message)
  }
}

// POST /api/bookings/backfill-splits — one-time backfill for approved bookings missing sub-slots
export const backfillSplits = async (_req, res) => {
  try {
    const bookings = await Booking.find({ status: 'Approved' }).populate('slotId', 'date timeSlot hallId')
    const MIN_SUB_SLOT_MINUTES = 180
    const results = []

    for (const booking of bookings) {
      const slot = booking.slotId
      if (!slot || !slot.hallId) continue
      const timeRange = parseTimeRange(booking.message)
      if (!timeRange) continue

      const slotParts = slot.timeSlot.match(/^(.+?)-(.+)$/)
      if (!slotParts) continue

      const slotStart = toMinutes(slotParts[1])
      const slotEnd = toMinutes(slotParts[2])
      const bookedStart = toMinutes(timeRange.start)
      const bookedEnd = toMinutes(timeRange.end)
      const created = []

      const bookedTs = `${toLabel(bookedStart)}-${toLabel(bookedEnd)}`

      if (slot.timeSlot !== bookedTs) {
        await Slot.findByIdAndUpdate(slot._id, { timeSlot: bookedTs, isBooked: true })
        created.push(`updated original → ${bookedTs}`)
      } else if (!slot.isBooked) {
        await Slot.findByIdAndUpdate(slot._id, { isBooked: true })
        created.push(`marked booked: ${bookedTs}`)
      }

      if (bookedStart > slotStart && (bookedStart - slotStart) > MIN_SUB_SLOT_MINUTES) {
        const ts = `${toLabel(slotStart)}-${toLabel(bookedStart)}`
        await Slot.findOneAndUpdate(
          { hallId: slot.hallId, date: slot.date, timeSlot: ts },
          { hallId: slot.hallId, date: slot.date, timeSlot: ts, isBooked: false },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
        created.push(ts)
      }
      if (bookedEnd < slotEnd && (slotEnd - bookedEnd) > MIN_SUB_SLOT_MINUTES) {
        const ts = `${toLabel(bookedEnd)}-${toLabel(slotEnd)}`
        await Slot.findOneAndUpdate(
          { hallId: slot.hallId, date: slot.date, timeSlot: ts },
          { hallId: slot.hallId, date: slot.date, timeSlot: ts, isBooked: false },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
        created.push(ts)
      }

      if (created.length) {
        results.push({ bookingId: booking._id, originalSlot: slot.timeSlot, date: slot.date, created })
      }
    }

    return res.json({ message: `Backfill complete. Fixed ${results.length} booking(s).`, results })
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

    // Custodian approving a principal-required booking → escalate
    if (status === 'Approved' && booking.requiresPrincipalApproval && booking.status === 'Pending') {
      booking.status = 'CustodianApproved'
      await booking.save()
      await _sendPrincipalEmail(booking)
      return res.json({ message: 'Booking escalated to Principal for final approval.', booking })
    }

    booking.status = status
    await booking.save()

    if (status === 'Approved') {
      const slotId = booking.slotId?._id || booking.slotId
      const slot = await Slot.findById(slotId)
      const timeRange = parseTimeRange(booking.message)
      const MIN_SUB_SLOT_MINUTES = 180

      console.log('Slot split debug:', { slotId: slotId?.toString(), timeRange, timeSlot: slot?.timeSlot, message: booking.message })

      if (slot && timeRange) {
        const slotParts = slot.timeSlot.match(/^(.+?)-(.+)$/)
        if (slotParts) {
          const slotStart = toMinutes(slotParts[1])
          const slotEnd = toMinutes(slotParts[2])
          const bookedStart = toMinutes(timeRange.start)
          const bookedEnd = toMinutes(timeRange.end)

          console.log('Slot split times:', { slotStart, slotEnd, bookedStart, bookedEnd })

          const bookedTs = `${toLabel(bookedStart)}-${toLabel(bookedEnd)}`

          await Slot.findByIdAndUpdate(slotId, { timeSlot: bookedTs, isBooked: true })
          console.log('Updated original slot to booked time only:', bookedTs)

          if (bookedStart > slotStart && (bookedStart - slotStart) > MIN_SUB_SLOT_MINUTES) {
            const ts = `${toLabel(slotStart)}-${toLabel(bookedStart)}`
            const created = await Slot.findOneAndUpdate(
              { hallId: slot.hallId, date: slot.date, timeSlot: ts },
              { hallId: slot.hallId, date: slot.date, timeSlot: ts, isBooked: false },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            )
            console.log('Created before sub-slot:', ts, created?._id?.toString())
          } else if (bookedStart > slotStart) {
            console.log('Skipped before sub-slot (≤3h):', toLabel(slotStart), 'to', toLabel(bookedStart), '=', bookedStart - slotStart, 'min')
          }
          if (bookedEnd < slotEnd && (slotEnd - bookedEnd) > MIN_SUB_SLOT_MINUTES) {
            const ts = `${toLabel(bookedEnd)}-${toLabel(slotEnd)}`
            const created = await Slot.findOneAndUpdate(
              { hallId: slot.hallId, date: slot.date, timeSlot: ts },
              { hallId: slot.hallId, date: slot.date, timeSlot: ts, isBooked: false },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            )
            console.log('Created after sub-slot:', ts, created?._id?.toString())
          } else if (bookedEnd < slotEnd) {
            console.log('Skipped after sub-slot (≤3h):', toLabel(bookedEnd), 'to', toLabel(slotEnd), '=', slotEnd - bookedEnd, 'min')
          }
        } else {
          await Slot.findByIdAndUpdate(slotId, { isBooked: true })
          console.log('Slot timeSlot format not matched, marking whole slot booked:', slot.timeSlot)
        }
      } else {
        await Slot.findByIdAndUpdate(slotId, { isBooked: true })
        console.log('Split skipped, marking whole slot booked:', { hasSlot: !!slot, hasTimeRange: !!timeRange })
      }
        const bookingRef = `BK${booking._id.toString().slice(-4).toUpperCase()}`
        const msgSegmentsApproval = (booking.message || '').split('|').map(s => s.trim())
        const msgEventName = msgSegmentsApproval[0] || ''
        const msgTimeNeeded = msgSegmentsApproval.find(s => /^time needed:/i.test(s)) || ''
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
