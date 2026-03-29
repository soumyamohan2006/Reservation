import { Router } from 'express'
import { getAllSpaces, assignCustodian, getCustodians } from '../controllers/spaceController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, authorize('admin'), getAllSpaces)
router.post('/assign-custodian', authenticate, authorize('admin'), assignCustodian)
router.get('/custodians', authenticate, authorize('admin'), getCustodians)

export default router
