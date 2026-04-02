import Booking from '../models/Booking.js'
import Slot from '../models/Slot.js'
import User from '../models/User.js'
import { sendMail } from '../utils/mailer.js'
import { logger } from '../utils/logger.js'

export const testEmailRoute = async (_req, res) => {
  try {
    const response = await sendMail({
      to: process.env.CUSTODIAN_EMAIL,
      subject: 'Test Email',
      html: '<p>Email is working!</p>',
    })
    logger.info(response)
    res.json({ ok: true, message: `Email sent to ${process.env.CUSTODIAN_EMAIL}` })
  } catch (err) {
    logger.error({ err }, 'Test email failed')
    res.status(500).json({ ok: false, error: err.message })
  }
}

export const handleEmailBookingAction = async (req, res) => {
  const { status, token } = req.query
  if (!['Approved', 'Rejected'].includes(status) || token !== process.env.ACTION_SECRET)
    return res.status(403).send('<h2>Invalid or expired link.</h2>')

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
    }).catch(err => logger.error({ err }, 'Approval email error'))
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
}
