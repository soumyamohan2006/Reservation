import mongoose from 'mongoose'

// Hall represents a physical auditorium or seminar room
const hallSchema = new mongoose.Schema({
  name:       { type: String, required: true, unique: true, trim: true },
  capacity:   { type: Number, required: true },
  custodianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true })

export default mongoose.model('Hall', hallSchema)
