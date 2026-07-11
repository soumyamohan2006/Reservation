import { Router } from 'express'
import { register, login, setPassword, forgotPassword, resetPassword } from '../controllers/authController.js'

const router = Router()

router.post('/auth/register', register)
router.post('/auth/login', login)
router.post('/auth/set-password', setPassword)
router.post('/auth/forgot-password', forgotPassword)
router.post('/auth/reset-password', resetPassword)

export default router
