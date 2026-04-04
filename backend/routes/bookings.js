import { Router } from 'express'
import { createBooking, getAllBookings, getCustodianBookings, updateBookingStatus, getMyBookings, cancelBooking } from '../controllers/bookingController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

// Any authenticated user can request a booking
router.post('/', authenticate, createBooking)

// User views their own bookings
router.get('/my', authenticate, getMyBookings)

// User cancels their own pending booking
router.delete('/:id', authenticate, cancelBooking)

// Custodian views only their hall bookings
router.get('/custodian', authenticate, authorize('custodian'), getCustodianBookings)

// Admin/Custodian views all bookings
router.get('/', authenticate, authorize('admin', 'custodian'), getAllBookings)

// Custodian/admin approves or rejects a booking
router.put('/:id', authenticate, authorize('admin', 'custodian'), updateBookingStatus)

export default router
