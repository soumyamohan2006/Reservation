import { Router } from 'express'
import { createSlot, getAllSlots, getAvailableSlots, fixSlotHallIds, deleteSlot } from '../controllers/slotController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.get('/available', authenticate, getAvailableSlots)
router.post('/fix-hall-ids', authenticate, authorize('admin'), fixSlotHallIds)
router.post('/', authenticate, authorize('admin', 'custodian'), createSlot)
router.get('/', authenticate, authorize('admin'), getAllSlots)
router.delete('/:id', authenticate, authorize('admin', 'custodian'), deleteSlot)

export default router
