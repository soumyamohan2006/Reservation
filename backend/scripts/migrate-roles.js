import 'dotenv/config'
import mongoose from 'mongoose'
import User from './models/User.js'

await mongoose.connect(process.env.MONGO_URI)

// Update all users with role 'user' to 'student'
const result = await User.updateMany(
  { role: 'user' },
  { $set: { role: 'student' } }
)

console.log(`✅ Updated ${result.modifiedCount} users from 'user' to 'student'`)

await mongoose.disconnect()
