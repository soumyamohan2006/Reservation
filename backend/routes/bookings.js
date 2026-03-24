import { Router } from 'express'
import { createBooking, getAllBookings, updateBookingStatus } from '../controllers/bookingController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

// User requests a booking
router.post('/', authenticate, authorize('user'), createBooking)

// Custodian/admin views all bookings
router.get('/', authenticate, authorize('admin', 'custodian'), getAllBookings)

// Custodian/admin approves or rejects a booking
router.put('/:id', authenticate, authorize('admin', 'custodian'), updateBookingStatus)

export default router
