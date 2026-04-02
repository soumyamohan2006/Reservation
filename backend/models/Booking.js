import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hallId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true },
  slotId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  status:  { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  message: { type: String, default: '' },
  emailSentToCustodian: { type: Boolean, default: false },
  emailSentToUser: { type: Boolean, default: false },
  emailError: { type: String, default: '' },
}, { timestamps: true })

// Optimization: Index fields that are frequently queried
bookingSchema.index({ userId: 1 })
bookingSchema.index({ hallId: 1, status: 1 }) // For custodians fetching their hall's pending/approved bookings
bookingSchema.index({ slotId: 1 })
bookingSchema.index({ status: 1 })

export default mongoose.model('Booking', bookingSchema)
