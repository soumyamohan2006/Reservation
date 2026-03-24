import mongoose from 'mongoose'

const spaceSchema = new mongoose.Schema({
  hallId:      { type: String, required: true, unique: true },
  name:        { type: String, required: true },
  capacity:    { type: Number, required: true },
  description: { type: String },
  features:    [{ type: String }],
  image:       { type: String },
}, { timestamps: true })

export default mongoose.model('Space', spaceSchema)
