import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import { sendMail } from '../utils/mailer.js'

export const getAllUsers = async (_req, res) => {
  try {
    const users = await User.find().select('-password')
    return res.json(users)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

export const updateUserRole = async (req, res) => {
  const { role } = req.body
  if (!['student', 'faculty', 'admin', 'custodian'].includes(role))
    return res.status(400).json({ message: 'Invalid role.' })
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found.' })
    return res.json(user)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    return res.json({ message: 'User deleted.' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

export const createCustodian = async (req, res) => {
  const { name, email } = req.body
  if (!name || !email)
    return res.status(400).json({ message: 'name and email are required.' })
  try {
    if (await User.findOne({ email }))
      return res.status(409).json({ message: 'Email already exists.' })
    const password = Math.random().toString(36).slice(-8)
    const user = await User.create({ name, email, password, role: 'custodian' })
    
    // Send welcome email with password setup link
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' })
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const setPasswordLink = `${frontendUrl}/set-password?token=${token}`
    
    try {
      await sendMail({
        to: user.email,
        subject: 'Welcome - Custodian Account Created',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:540px;margin:auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:0.75rem;padding:2rem">
            <h2 style="color:#1e40af;margin-top:0">Welcome to Hall Booking System</h2>
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>Your custodian account has been created by the administrator.</p>
            <p>Please set your password to activate your account and access the system.</p>
            <p>Click the link below to set your password:</p>
            <a href="${setPasswordLink}" style="display:inline-block;padding:0.75rem 1.5rem;background:#1e40af;color:#ffffff;text-decoration:none;border-radius:0.5rem;font-weight:600;margin:1rem 0">
              Set Password
            </a>
            <p style="color:#64748b;font-size:0.875rem;margin-top:1.5rem">This link will expire in 24 hours.</p>
            <p style="margin-top:2rem">Regards,<br/><strong>Admin</strong></p>
          </div>
        `,
      })
      console.log('✓ Custodian email sent to:', user.email)
    } catch (emailErr) {
      console.error('✗ Email send failed:', emailErr.message)
    }
    
    return res.status(201).json({ user: { _id: user._id, name: user.name, email: user.email, role: user.role }, tempPassword: password })
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: 'Email already exists.' })
    return res.status(500).json({ message: err.message })
  }
}
