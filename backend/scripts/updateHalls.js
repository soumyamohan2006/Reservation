import 'dotenv/config'
import mongoose from 'mongoose'
import Hall from './models/Hall.js'
import { logger } from './utils/logger.js'

const richInfo = {
  'Auditorium': {
    description: 'Meetings, workshops, presentations',
    features: ['Projector', 'Audio System', 'Stage','Control Room for Technical Support'],
    image: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80',
    pricePerHour: 150
  },
  'Seminar Hall': {
    description: 'Seminars, conferences, guest lectures',
    features: ['Stage', 'Podium', 'Centralized AC', 'Professional Lighting'],
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    pricePerHour: 75
  },
  'CGPC Hall': {
    description: 'Training programs and academic sessions',
    features: ['Projector', 'AC', 'Wi-Fi', 'Audio System', 'Podium', 'Stage'],
    image: 'https://images.unsplash.com/photo-1497366412874-3415097a27e7?auto=format&fit=crop&w=1200&q=80',
    pricePerHour: 50
  }
}

const updateHalls = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    logger.info('Connected to DB, updating rich hall data...')

    for (const [name, updateData] of Object.entries(richInfo)) {
      await Hall.updateOne({ name }, { $set: updateData })
      logger.info(`Updated: ${name}`)
    }

    logger.info('Rich hall data seed completed.')
    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

updateHalls()
