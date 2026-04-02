import 'dotenv/config'
import mongoose from 'mongoose'
import Hall from '../models/Hall.js'
import User from '../models/User.js'
import { logger } from '../utils/logger.js'

const seedDefaults = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    logger.info(`Connected to MongoDB: ${conn.connection.host}`)

    // Seed default halls
    const hallCount = await Hall.countDocuments()
    if (hallCount === 0) {
      await Hall.insertMany([
        { name: 'Auditorium', capacity: 500 },
        { name: 'Seminar Hall', capacity: 200 },
        { name: 'CGPC Hall', capacity: 50 },
      ])
      logger.info('Default halls seeded.')
    } else {
      logger.info('Halls already exist. Skipping seed.')
    }

    // Seed default admin account
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL })
    if (!adminExists) {
      await User.create({ name: 'Admin', email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, role: 'admin' })
      logger.info(`Admin seeded: ${process.env.ADMIN_EMAIL}`)
    } else {
      logger.info('Admin already exists. Skipping seed.')
    }

    // Seed default custodian account
    const custodianExists = await User.findOne({ email: process.env.CUSTODIAN_EMAIL })
    if (!custodianExists) {
      await User.create({ name: 'Custodian', email: process.env.CUSTODIAN_EMAIL, password: process.env.CUSTODIAN_PASSWORD, role: 'custodian' })
      logger.info(`Custodian seeded: ${process.env.CUSTODIAN_EMAIL}`)
    } else {
      logger.info('Custodian already exists. Skipping seed.')
    }

    logger.info('Database defaults seeding completed successfully.')
    process.exit(0)
  } catch (err) {
    logger.fatal({ err }, 'Seeding failed')
    process.exit(1)
  }
}

seedDefaults()
