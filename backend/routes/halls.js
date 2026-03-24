import { Router } from 'express'
import { createHall, getHalls } from '../controllers/hallController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

// Admin creates a hall
router.post('/', authenticate, authorize('admin'), createHall)

// Any user (even unauthenticated) can view halls
router.get('/', getHalls)

export default router
