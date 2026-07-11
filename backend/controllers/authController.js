import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { sendMail } from '../utils/mailer.js'

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )

// POST /api/auth/register
export const register = async (req, res) => {
  const { name, email, password, role } = req.body
  if (!name || !email || !password)
    return res.status(400).json({ message: 'name, email and password are required.' })

  try {
    if (await User.findOne({ email }))
      return res.status(409).json({ message: 'Email already registered.' })

    const user = await User.create({ name, email, password, role })
    return res.status(201).json({ token: signToken(user), id: user._id, name: user.name, role: user.role })
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: 'Email already registered.' })
    return res.status(500).json({ message: err.message })
  }
}

// POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ message: 'email and password are required.' })

  try {
    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password.' })

    return res.json({ token: signToken(user), id: user._id, name: user.name, role: user.role })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

// POST /api/auth/set-password
export const setPassword = async (req, res) => {
  const { token, password } = req.body
  if (!token || !password)
    return res.status(400).json({ message: 'token and password are required.' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    user.password = password
    await user.save()
    return res.json({ message: 'Password set successfully.' })
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ message: 'Token has expired.' })
    return res.status(500).json({ message: err.message })
  }
}

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ message: 'Email is required.' })

  try {
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.json({ message: 'If an account exists with that email, a reset link has been sent.' })

    const resetToken = jwt.sign({ id: user._id, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '1h' })
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`

    await sendMail({
      to: user.email,
      subject: 'Reset your Campus Spaces password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
          <h2 style="color: #0f172a;">Password Reset</h2>
          <p style="color: #475569;">Hi ${user.name},</p>
          <p style="color: #475569;">You requested a password reset. Click the button below to set a new password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 0.75rem 1.5rem; background: #2563eb; color: #fff; text-decoration: none; border-radius: 0.5rem; font-weight: 700; margin: 1rem 0;">Reset Password</a>
          <p style="color: #94a3b8; font-size: 0.8rem;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    })

    return res.json({ message: 'If an account exists with that email, a reset link has been sent.' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  const { token, password } = req.body
  if (!token || !password) return res.status(400).json({ message: 'Token and password are required.' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.purpose !== 'reset') return res.status(401).json({ message: 'Invalid token.' })

    const user = await User.findById(decoded.id)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    user.password = password
    await user.save()
    return res.json({ message: 'Password reset successfully.' })
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Reset link has expired.' })
    return res.status(500).json({ message: err.message })
  }
}
