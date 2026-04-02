import 'dotenv/config'
import mongoose from 'mongoose'
import Booking from './models/Booking.js'

await mongoose.connect(process.env.MONGO_URI)

// Add email tracking fields to all existing bookings
const result = await Booking.updateMany(
  {},
  {
    $set: {
      emailSentToCustodian: false,
      emailSentToUser: false,
      emailError: ''
    }
  }
)

console.log(`✅ Updated ${result.modifiedCount} bookings with email tracking fields`)

await mongoose.disconnect()
