import 'dotenv/config'
import mongoose from 'mongoose'
import fs from 'fs'
import User from './models/User.js'
import Hall from './models/Hall.js'
import Slot from './models/Slot.js'
import Booking from './models/Booking.js'

async function restore(backupPath) {
  try {
    if (!backupPath) {
      console.log('❌ Please provide backup folder path')
      console.log('Usage: node restore.js <backup-folder-path>')
      console.log('Example: node restore.js ./backups/2024-01-15T10-30-00-000Z')
      process.exit(1)
    }

    if (!fs.existsSync(backupPath)) {
      console.log(`❌ Backup folder not found: ${backupPath}`)
      process.exit(1)
    }

    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB\n')

    // Restore Users
    if (fs.existsSync(`${backupPath}/users.json`)) {
      const users = JSON.parse(fs.readFileSync(`${backupPath}/users.json`, 'utf8'))
      console.log(`📂 Found ${users.length} users in backup`)
      
      let restored = 0
      let skipped = 0
      for (const user of users) {
        try {
          const exists = await User.findOne({ email: user.email })
          if (!exists) {
            await User.create(user)
            restored++
          } else {
            skipped++
          }
        } catch (err) {
          console.log(`   ⚠️  Skipped user ${user.email}: ${err.message}`)
          skipped++
        }
      }
      console.log(`   ✅ Restored ${restored} users, skipped ${skipped} (already exist)\n`)
    }

    // Restore Halls
    if (fs.existsSync(`${backupPath}/halls.json`)) {
      const halls = JSON.parse(fs.readFileSync(`${backupPath}/halls.json`, 'utf8'))
      console.log(`📂 Found ${halls.length} halls in backup`)
      
      let restored = 0
      let skipped = 0
      for (const hall of halls) {
        try {
          const exists = await Hall.findOne({ name: hall.name })
          if (!exists) {
            await Hall.create(hall)
            restored++
          } else {
            skipped++
          }
        } catch (err) {
          console.log(`   ⚠️  Skipped hall ${hall.name}: ${err.message}`)
          skipped++
        }
      }
      console.log(`   ✅ Restored ${restored} halls, skipped ${skipped} (already exist)\n`)
    }

    // Restore Slots
    if (fs.existsSync(`${backupPath}/slots.json`)) {
      const slots = JSON.parse(fs.readFileSync(`${backupPath}/slots.json`, 'utf8'))
      console.log(`📂 Found ${slots.length} slots in backup`)
      
      let restored = 0
      let skipped = 0
      for (const slot of slots) {
        try {
          const exists = await Slot.findOne({ 
            hallId: slot.hallId, 
            date: slot.date, 
            timeSlot: slot.timeSlot 
          })
          if (!exists) {
            await Slot.create(slot)
            restored++
          } else {
            skipped++
          }
        } catch (err) {
          console.log(`   ⚠️  Skipped slot: ${err.message}`)
          skipped++
        }
      }
      console.log(`   ✅ Restored ${restored} slots, skipped ${skipped} (already exist)\n`)
    }

    // Restore Bookings
    if (fs.existsSync(`${backupPath}/bookings.json`)) {
      const bookings = JSON.parse(fs.readFileSync(`${backupPath}/bookings.json`, 'utf8'))
      console.log(`📂 Found ${bookings.length} bookings in backup`)
      
      let restored = 0
      let skipped = 0
      for (const booking of bookings) {
        try {
          const exists = await Booking.findById(booking._id)
          if (!exists) {
            await Booking.create(booking)
            restored++
          } else {
            skipped++
          }
        } catch (err) {
          console.log(`   ⚠️  Skipped booking: ${err.message}`)
          skipped++
        }
      }
      console.log(`   ✅ Restored ${restored} bookings, skipped ${skipped} (already exist)\n`)
    }

    console.log('🎉 Restore completed successfully!')
    
    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error('❌ Restore failed:', err.message)
    process.exit(1)
  }
}

const backupPath = process.argv[2]
restore(backupPath)
