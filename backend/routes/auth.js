import { Router } from 'express'
import { register, login, setPassword } from '../controllers/authController.js'
import { validate } from '../middleware/validate.js'
import { z } from 'zod'

const router = Router()

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['faculty', 'admin', 'custodian']).optional()
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

router.post('/auth/register', validate(registerSchema), register)
router.post('/auth/login', validate(loginSchema), login)
router.post('/auth/set-password', setPassword)

export default router
