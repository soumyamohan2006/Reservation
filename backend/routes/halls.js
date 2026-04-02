import { Router } from 'express'
import { createHall, getHalls, getCustodianHalls, updateHall, deleteHall } from '../controllers/hallController.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { z } from 'zod'
import mongoose from 'mongoose'

const router = Router()

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
})

const createHallSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  capacity: z.number().int().positive('Capacity must be a positive integer'),
  custodianId: objectIdSchema.optional().nullable()
})

const updateHallSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  capacity: z.number().int().positive('Capacity must be a positive integer').optional(),
  custodianId: objectIdSchema.optional().nullable()
})

router.post('/', authenticate, authorize('admin'), validate(createHallSchema), createHall)
router.get('/custodian', authenticate, authorize('custodian'), getCustodianHalls)
router.get('/', getHalls)
router.patch('/:id', authenticate, authorize('admin'), validate(updateHallSchema), updateHall)
router.delete('/:id', authenticate, authorize('admin'), deleteHall)

export default router
