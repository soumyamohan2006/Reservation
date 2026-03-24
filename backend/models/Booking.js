import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hallId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true },
  slotId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  status:  { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  message: { type: String, default: '' }, // optional request message from user
}, { timestamps: true })

export default mongoose.model('Booking', bookingSchema)
