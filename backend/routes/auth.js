import { Router } from 'express'
import { register, login, setPassword, forgotPassword, resetPassword } from '../controllers/authController.js'
import { validate } from '../middleware/validate.js'
import { z } from 'zod'

const router = Router()

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'faculty']).optional()
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  email: z.string().email('Invalid email address'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters')
})

router.post('/auth/register', validate(registerSchema), register)
router.post('/auth/login', validate(loginSchema), login)
router.post('/auth/set-password', setPassword)
router.post('/auth/forgot-password', validate(forgotPasswordSchema), forgotPassword)
router.post('/auth/reset-password', validate(resetPasswordSchema), resetPassword)

export default router
