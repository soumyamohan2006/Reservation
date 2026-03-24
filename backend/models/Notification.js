import mongoose from 'mongoose'

// Notification sent to custodian/admin when a booking is requested or updated
const notificationSchema = new mongoose.Schema({
  toRole:    { type: String, enum: ['custodian', 'admin'], required: true },
  message:   { type: String, required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  isRead:    { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.model('Notification', notificationSchema)
