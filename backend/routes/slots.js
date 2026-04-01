import { Router } from 'express'
import { createSlot, getAllSlots, getCustodianSlots, getAvailableSlots, fixSlotHallIds, deleteSlot, bulkDeleteSlots } from '../controllers/slotController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.get('/available', authenticate, getAvailableSlots)
router.get('/custodian', authenticate, authorize('custodian'), getCustodianSlots)
router.post('/fix-hall-ids', authenticate, authorize('admin'), fixSlotHallIds)
router.post('/', authenticate, authorize('admin', 'custodian'), createSlot)
router.post('/bulk-delete', authenticate, authorize('admin'), bulkDeleteSlots)
router.get('/', authenticate, authorize('admin'), getAllSlots)
router.delete('/:id', authenticate, authorize('admin', 'custodian'), deleteSlot)

export default router
