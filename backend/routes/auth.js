import { Router } from 'express'
import { register, login, setPassword } from '../controllers/authController.js'

const router = Router()

router.post('/auth/register', register)
router.post('/auth/login', login)
router.post('/auth/set-password', setPassword)

export default router
