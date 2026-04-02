import { Router } from 'express'
import { handleEmailBookingAction, testEmailRoute } from '../controllers/publicController.js'

const router = Router()

// Public route to confirm/reject a booking directly via email link
router.get('/booking-action/:id', handleEmailBookingAction)

// Route to verify nodemailer config is working
router.get('/test-email', testEmailRoute)

export default router
