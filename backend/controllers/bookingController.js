import Booking from '../models/Booking.js'
import Slot from '../models/Slot.js'
import Hall from '../models/Hall.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import { sendMail } from '../utils/mailer.js'
import { newBookingRequestTemplate, bookingApprovedTemplate } from '../templates/emailTemplates.js'

const canManageHall = async (hallId, user) => {
  if (user.role === 'admin') return true

  const hall = await Hall.findOne({ _id: hallId, custodianId: user.id })
  return !!hall
}

// POST /api/bookings — user requests a booking
export const createBooking = async (req, res) => {
  const { hallId, slotId, message } = req.body

  try {
    const slot = await Slot.findById(slotId).populate({ path: 'hallId', populate: { path: 'custodianId', select: 'name email' } })
    if (!slot) return res.status(404).json({ message: 'Slot not found.' })

    if (slot.isBooked)
      return res.status(409).json({ message: 'Slot is already booked.' })

    // Prevent overbooking: Check if slot already has pending or approved booking
    const existingBooking = await Booking.findOne({ 
      slotId, 
      status: { $in: ['Pending', 'Approved'] } 
    })
    if (existingBooking) {
      return res.status(409).json({ message: 'This slot is no longer available (another user just booked it).' })
    }

    if (hallId && hallId !== slot.hallId?._id?.toString()) {
      return res.status(400).json({ message: 'hallId must match the selected slot.' })
    }

    const booking = await Booking.create({
      userId: req.user.id,
      hallId: slot.hallId?._id || slot.hallId,
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
        html: newBookingRequestTemplate({
          bookingRef,
          userName: user.name,
          userEmail: user.email,
          hallName,
          msgEvent,
          slotDate: slot.date,
          slotTimeSlot: slot.timeSlot,
          msgTime,
          message,
          roleLabel,
          requestedOn,
          base,
        }),
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

// GET /api/bookings/my-bookings — authenticated user views their own bookings
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('userId', 'name email')
      .populate('hallId', 'name capacity image imageUrl')
      .populate('slotId', 'date timeSlot isBooked')
      .sort({ createdAt: -1 })

    return res.json(bookings)
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

  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('hallId', 'name')
      .populate('slotId', 'date timeSlot')
    if (!booking) return res.status(404).json({ message: 'Booking not found.' })

    if (req.user.role === 'custodian') {
      const allowed = await canManageHall(booking.hallId?._id || booking.hallId, req.user)
      if (!allowed) {
        return res.status(403).json({ message: 'Access denied for this hall.' })
      }
    }

    booking.status = status
    await booking.save()

    if (status === 'Approved') {
      await Slot.findByIdAndUpdate(booking.slotId, { isBooked: true })
      const bookingRef = `BK${booking._id.toString().slice(-4).toUpperCase()}`
      
      try {
        await sendMail({
          to: booking.userId.email,
          subject: `Your Booking ${bookingRef} Has Been Approved`,
          html: bookingApprovedTemplate({
            bookingRef,
            userName: booking.userId.name,
            hallName: booking.hallId?.name,
            slotDate: booking.slotId?.date,
            slotTimeSlot: booking.slotId?.timeSlot,
          }),
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

// DELETE /api/bookings/:id — user/admin/custodian cancels a booking
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('hallId', 'name')
      .populate('slotId', 'date timeSlot')
    
    if (!booking) return res.status(404).json({ message: 'Booking not found.' })

    // Check permissions: User can cancel their own bookings, admin/custodian can cancel any
    if (req.user.role !== 'admin' && req.user.role !== 'custodian' && booking.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only cancel your own bookings.' })
    }

    // Only allow cancelling if booking is not yet approved or already rejected
    if (booking.status === 'Approved') {
      return res.status(400).json({ message: 'Cannot cancel an approved booking. Contact the custodian.' })
    }

    // If booking was approved, release the slot
    if (booking.status === 'Approved') {
      await Slot.findByIdAndUpdate(booking.slotId, { isBooked: false })
    }

    // Update booking status to cancelled
    booking.status = 'Cancelled'
    await booking.save()

    // Notify custodian of cancellation
    const bookingRef = `BK${booking._id.toString().slice(-4).toUpperCase()}`
    await Notification.create({
      toRole: 'custodian',
      message: `Booking ${bookingRef} has been cancelled by ${req.user.role}.`,
      bookingId: booking._id,
    })

    // Send cancellation email to user
    try {
      await sendMail({
        to: booking.userId.email,
        subject: `Booking Cancellation Confirmed — ${bookingRef}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:540px;margin:auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:0.75rem;padding:2rem">
            <h2 style="color:#dc2626;margin-top:0">Booking Cancelled</h2>
            <p>Hello <strong>${booking.userId.name}</strong>,</p>
            <p>Your booking request (${bookingRef}) for <strong>${booking.hallId?.name}</strong> has been cancelled.</p>
            <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:1rem;margin:1rem 0">
              <p style="margin:0"><strong>Booking Details:</strong></p>
              <p style="margin:0.5rem 0">📅 Date: ${booking.slotId?.date}</p>
              <p style="margin:0.5rem 0">⏰ Time Slot: ${booking.slotId?.timeSlot}</p>
              <p style="margin:0.5rem 0">Status: Cancelled</p>
            </div>
            <p style="margin-top:1.5rem">If you have any questions, please contact the administrator.</p>
            <p style="margin-top:2rem">Regards,<br/><strong>Hall Booking System</strong></p>
          </div>
        `,
      })
    } catch (err) {
      console.error('Cancellation email error:', err.message)
    }

    return res.json({ message: 'Booking cancelled successfully.', booking })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}
