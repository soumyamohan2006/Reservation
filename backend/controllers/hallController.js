import Hall from '../models/Hall.js'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import { sendMail } from '../utils/mailer.js'

export const createHall = async (req, res) => {
  const { name, capacity, custodianId } = req.body
  if (!name || !capacity)
    return res.status(400).json({ message: 'name and capacity are required.' })
  try {
    const hall = await Hall.create({ name, capacity, custodianId: custodianId || null })
    return res.status(201).json(hall)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

export const getHalls = async (_req, res) => {
  try {
    const halls = await Hall.find().populate('custodianId', 'name email')
    return res.json(halls)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

export const getCustodianHalls = async (req, res) => {
  try {
    const halls = await Hall.find({ custodianId: req.user.id }).populate('custodianId', 'name email')
    return res.json(halls)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

export const updateHall = async (req, res) => {
  try {
    const oldHall = await Hall.findById(req.params.id)
    const hall = await Hall.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('custodianId', 'name email')
    if (!hall) return res.status(404).json({ message: 'Hall not found.' })
    
    // Send email if custodian was newly assigned
    if (req.body.custodianId && oldHall.custodianId?.toString() !== req.body.custodianId) {
      const custodian = await User.findById(req.body.custodianId)
      if (custodian) {
        const token = jwt.sign({ userId: custodian._id }, process.env.JWT_SECRET, { expiresIn: '1h' })
        const setPasswordLink = `http://localhost:5173/set-password?token=${token}`
        
        sendMail({
          to: custodian.email,
          subject: 'You Have Been Assigned as Custodian',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:540px;margin:auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:0.75rem;padding:2rem">
              <h2 style="color:#1e40af;margin-top:0">Custodian Assignment</h2>
              <p>Hello <strong>${custodian.name}</strong>,</p>
              <p>You have been assigned as the custodian for:</p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:0.5rem;padding:1rem;margin:1rem 0">
                <p style="margin:0;color:#64748b;font-size:0.875rem">Hall</p>
                <p style="margin:0.25rem 0 0;color:#0f172a;font-size:1.1rem;font-weight:700">${hall.name}</p>
              </div>
              <p>Please set your password to activate your account.</p>
              <p>Click the link below:</p>
              <a href="${setPasswordLink}" style="display:inline-block;padding:0.75rem 1.5rem;background:#1e40af;color:#ffffff;text-decoration:none;border-radius:0.5rem;font-weight:600;margin:1rem 0">
                Set Password
              </a>
              <p style="color:#64748b;font-size:0.875rem;margin-top:1.5rem">This link will expire in 1 hour.</p>
              <p style="margin-top:2rem">Regards,<br/><strong>Admin</strong></p>
            </div>
          `,
        }).catch(err => console.error('Custodian assignment email error:', err.message))
      }
    }
    
    return res.json(hall)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

export const deleteHall = async (req, res) => {
  try {
    await Hall.findByIdAndDelete(req.params.id)
    return res.json({ message: 'Hall deleted.' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}
