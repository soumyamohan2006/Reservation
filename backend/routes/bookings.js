import { Router } from 'express'
import { createBooking, getAllBookings, getCustodianBookings, getMyBookings, updateBookingStatus, cancelBooking } from '../controllers/bookingController.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { z } from 'zod'
import mongoose from 'mongoose'

const router = Router()

// Custom Zod schema for MongoDB ObjectIds
const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
})

const createBookingSchema = z.object({
  hallId: objectIdSchema,
  slotId: objectIdSchema,
  message: z.string().optional()
})

const updateBookingSchema = z.object({
  status: z.enum(['Approved', 'Rejected'], { required_error: 'Status is required and must be Approved or Rejected' })
})

// Any authenticated user can request a booking
router.post('/', authenticate, validate(createBookingSchema), createBooking)

// Custodian views only their hall bookings
router.get('/custodian', authenticate, authorize('custodian'), getCustodianBookings)
router.get('/custodian-bookings', authenticate, authorize('custodian'), getCustodianBookings)

// Authenticated user views their own bookings
router.get('/my-bookings', authenticate, getMyBookings)

// Admin views all bookings
router.get('/', authenticate, authorize('admin'), getAllBookings)

// Custodian/admin approves or rejects a booking
router.put('/:id', authenticate, authorize('admin', 'custodian'), validate(updateBookingSchema), updateBookingStatus)

// Any authenticated user/admin/custodian can cancel a booking
router.delete('/:id', authenticate, cancelBooking)


export default router
