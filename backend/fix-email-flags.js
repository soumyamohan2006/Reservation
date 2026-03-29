import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Booking from './models/Booking.js'

dotenv.config()

const fixEmailFlags = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')

    // Update all approved bookings to have emailSentToUser = true
    const result = await Booking.updateMany(
      { status: 'Approved', emailSentToUser: false },
      { $set: { emailSentToUser: true } }
    )

    console.log(`✅ Updated ${result.modifiedCount} approved booking(s) with emailSentToUser = true`)

    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

fixEmailFlags()
