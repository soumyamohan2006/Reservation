import 'dotenv/config'
import mongoose from 'mongoose'
import fs from 'fs'
import User from './models/User.js'
import Hall from './models/Hall.js'
import Slot from './models/Slot.js'
import Booking from './models/Booking.js'

async function backup() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = `./backups/${timestamp}`
    
    if (!fs.existsSync('./backups')) {
      fs.mkdirSync('./backups')
    }
    fs.mkdirSync(backupDir)

    // Backup users
    const users = await User.find().lean()
    fs.writeFileSync(`${backupDir}/users.json`, JSON.stringify(users, null, 2))
    console.log(`✅ Backed up ${users.length} users`)

    // Backup halls
    const halls = await Hall.find().lean()
    fs.writeFileSync(`${backupDir}/halls.json`, JSON.stringify(halls, null, 2))
    console.log(`✅ Backed up ${halls.length} halls`)

    // Backup slots
    const slots = await Slot.find().lean()
    fs.writeFileSync(`${backupDir}/slots.json`, JSON.stringify(slots, null, 2))
    console.log(`✅ Backed up ${slots.length} slots`)

    // Backup bookings
    const bookings = await Booking.find().lean()
    fs.writeFileSync(`${backupDir}/bookings.json`, JSON.stringify(bookings, null, 2))
    console.log(`✅ Backed up ${bookings.length} bookings`)

    console.log(`\n✅ Backup completed successfully!`)
    console.log(`📁 Backup location: ${backupDir}`)
    
    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error('❌ Backup failed:', err.message)
    process.exit(1)
  }
}

backup()
