import { Router } from 'express'
import { getAllUsers, updateUserRole, deleteUser, createCustodian, changePassword } from '../controllers/userController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, authorize('admin'), getAllUsers)
router.post('/custodian', authenticate, authorize('admin'), createCustodian)
router.patch('/:id/role', authenticate, authorize('admin'), updateUserRole)
router.delete('/:id', authenticate, authorize('admin'), deleteUser)
router.post('/change-password', authenticate, changePassword)

export default router
