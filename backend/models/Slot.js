import mongoose from 'mongoose'

// Slot represents an available time window for a hall on a specific date
const slotSchema = new mongoose.Schema({
  hallId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true },
  date:        { type: String, required: true },
  timeSlot:    { type: String, required: true },
  isBooked:    { type: Boolean, default: false },
  lockedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  lockedUntil: { type: Date, default: null },
}, { timestamps: true })


// Prevent duplicate slots for the same hall/date/timeSlot
slotSchema.index({ hallId: 1, date: 1, timeSlot: 1 }, { unique: true })

export default mongoose.model('Slot', slotSchema)
