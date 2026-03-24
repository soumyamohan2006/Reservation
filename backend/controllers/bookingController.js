import Booking from '../models/Booking.js'
import Slot from '../models/Slot.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import { sendMail } from '../utils/mailer.js'

// POST /api/bookings — user requests a booking
export const createBooking = async (req, res) => {
  const { hallId, slotId, message } = req.body
  if (!hallId || !slotId)
    return res.status(400).json({ message: 'hallId and slotId are required.' })

  try {
    const slot = await Slot.findById(slotId).populate('hallId', 'name')
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
    const user = await User.findById(req.user.id, 'name email')
    const hallName = slot.hallId?.name || 'Hall'
    sendMail({
      to: process.env.CUSTODIAN_EMAIL,
      subject: 'New Hall Booking Request',
      html: `
        <h3>New Booking Request</h3>
        <p><b>Requested by:</b> ${user.name} (${user.email})</p>
        <p><b>Hall:</b> ${hallName}</p>
        <p><b>Date:</b> ${slot.date}</p>
        <p><b>Time Slot:</b> ${slot.timeSlot}</p>
        <p><b>Message:</b> ${message || 'N/A'}</p>
        <p>Please log in to the admin panel to approve or reject this request.</p>
      `,
    }).catch(err => console.error('Custodian email error:', err.message))

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

      // Email user only on approval
      sendMail({
        to: booking.userId.email,
        subject: 'Your Hall Booking Has Been Approved',
        html: `
          <h3>Booking Approved!</h3>
          <p>Hi ${booking.userId.name},</p>
          <p>Your booking request has been <b>approved</b> by the custodian.</p>
          <p><b>Hall:</b> ${booking.hallId?.name || 'Hall'}</p>
          <p><b>Date:</b> ${booking.slotId?.date}</p>
          <p><b>Time Slot:</b> ${booking.slotId?.timeSlot}</p>
          <p>Thank you for using the Hall Booking System.</p>
        `,
      }).catch(err => console.error('User approval email error:', err.message))
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
