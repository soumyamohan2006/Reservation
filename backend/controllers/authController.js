import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { sendMail } from '../utils/mailer.js'
import crypto from 'crypto'

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

// POST /api/auth/forgot-password — send password reset email
export const forgotPassword = async (req, res) => {
  const { email } = req.body
  if (!email)
    return res.status(400).json({ message: 'Email is required.' })

  try {
    const user = await User.findOne({ email })
    if (!user)
      return res.status(404).json({ message: 'User with this email not found.' })

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    user.resetToken = resetToken
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    await user.save()

    // Send email with reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

    await sendMail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:540px;margin:auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:0.75rem;padding:2rem">
          <h2 style="color:#1e40af;margin-top:0">Password Reset Request</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>We received a request to reset the password for your account. If you didn't make this request, you can ignore this email.</p>
          <p>To reset your password, click the button below:</p>
          <a href="${resetLink}" style="display:inline-block;padding:0.75rem 1.5rem;background:#1e40af;color:#ffffff;text-decoration:none;border-radius:0.5rem;font-weight:600;margin:1rem 0">
            Reset Password
          </a>
          <p style="color:#64748b;font-size:0.875rem;margin-top:1.5rem">This link will expire in 1 hour for security reasons.</p>
          <p style="margin-top:2rem">Regards,<br/><strong>Hall Booking System</strong></p>
        </div>
      `,
    })

    return res.json({ message: 'Password reset link sent to your email.' })
  } catch (err) {
    console.error('Forgot password error:', err.message)
    return res.status(500).json({ message: err.message })
  }
}

// POST /api/auth/reset-password — reset password with token
export const resetPassword = async (req, res) => {
  const { token, email, newPassword } = req.body
  if (!token || !email || !newPassword)
    return res.status(400).json({ message: 'token, email, and newPassword are required.' })

  if (newPassword.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters.' })

  try {
    const user = await User.findOne({ email })
    if (!user)
      return res.status(404).json({ message: 'User not found.' })

    if (!user.resetToken || user.resetToken !== token)
      return res.status(400).json({ message: 'Invalid password reset token.' })

    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry)
      return res.status(400).json({ message: 'Password reset token has expired.' })

    // Update password
    user.password = newPassword
    user.resetToken = null
    user.resetTokenExpiry = null
    await user.save()

    return res.json({ message: 'Password reset successfully. You can now login with your new password.' })
  } catch (err) {
    console.error('Reset password error:', err.message)
    return res.status(500).json({ message: err.message })
  }
}
