import mongoose from 'mongoose'
import { logger } from '../utils/logger.js'

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    logger.info(`Connected to MongoDB: ${conn.connection.host}`)
  } catch (err) {
    logger.fatal({ err }, 'MongoDB connection failed')
    process.exit(1)
  }
}
