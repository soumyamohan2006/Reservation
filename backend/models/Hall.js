import mongoose from 'mongoose'

// Hall represents a physical auditorium or seminar room
const hallSchema = new mongoose.Schema({
  name:         { type: String, required: true, unique: true, trim: true },
  description:  { type: String, default: '' },
  capacity:     { type: Number, required: true },
  pricePerHour: { type: Number, default: 0 },
  features:     { type: [String], default: [] },
  image:        { type: String, default: '' },
  custodianId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true })

hallSchema.index({ custodianId: 1 }) // Optimize fetching halls managed by a specific custodian

export default mongoose.model('Hall', hallSchema)
