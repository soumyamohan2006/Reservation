import { Router } from 'express'
import { createHall, getHalls, getCustodianHalls, updateHall, deleteHall } from '../controllers/hallController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.post('/', authenticate, authorize('admin'), createHall)
router.get('/custodian', authenticate, authorize('custodian'), getCustodianHalls)
router.get('/', getHalls)
router.patch('/:id', authenticate, authorize('admin'), updateHall)
router.delete('/:id', authenticate, authorize('admin'), deleteHall)

export default router
