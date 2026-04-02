import 'dotenv/config'
import mongoose from 'mongoose'
import Hall from '../models/Hall.js'
import Slot from '../models/Slot.js'
import { logger } from '../utils/logger.js'

const fixHallIds = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    logger.info(`Connected to MongoDB: ${conn.connection.host}`)

    const allHalls = await Hall.find()
    for (const hall of allHalls) {
      await Slot.collection.updateMany({ hallId: hall.name }, { $set: { hallId: hall._id } })
      await Slot.collection.updateMany({ hallId: hall.name.toLowerCase() }, { $set: { hallId: hall._id } })
    }

    const { ObjectId } = mongoose.Types
    const rawSlots = await Slot.collection.find({}).toArray()
    let fixedCount = 0

    for (const s of rawSlots) {
      if (typeof s.hallId === 'string' && ObjectId.isValid(s.hallId)) {
        await Slot.collection.updateOne({ _id: s._id }, { $set: { hallId: new ObjectId(s.hallId) } })
        fixedCount++
      }
    }

    logger.info(`Hall ID string conversion applied successfully. Fixed ${fixedCount} entries.`)
    process.exit(0)
  } catch (err) {
    logger.fatal({ err }, 'Hall ID migration failed')
    process.exit(1)
  }
}

fixHallIds()
