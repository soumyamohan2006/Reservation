import Slot from '../models/Slot.js'
import { logger } from '../utils/logger.js'

export const initSlotCleanup = () => {
  const deletePastSlots = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const result = await Slot.deleteMany({ date: { $lt: today } })
      if (result.deletedCount > 0) logger.info(`Cleaned up ${result.deletedCount} past slot(s).`)
    } catch (err) {
      logger.error({ err }, 'Failed to clean up past slots')
    }
  }

  // Run immediately on boot
  deletePastSlots()

  // Schedule to run every day at midnight
  const now = new Date()
  const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0) - now

  setTimeout(() => {
    deletePastSlots()
    setInterval(deletePastSlots, 24 * 60 * 60 * 1000)
  }, msUntilMidnight)
}
