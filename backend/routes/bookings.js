import { Router } from 'express'
import { createBooking, getAllBookings, getCustodianBookings, updateBookingStatus } from '../controllers/bookingController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

// Any authenticated user can request a booking
router.post('/', authenticate, createBooking)

// Custodian views only their hall bookings
router.get('/custodian', authenticate, authorize('custodian'), getCustodianBookings)

// Admin/Custodian views all bookings
router.get('/', authenticate, authorize('admin', 'custodian'), getAllBookings)

// Custodian/admin approves or rejects a booking
router.put('/:id', authenticate, authorize('admin', 'custodian'), updateBookingStatus)

export default router
