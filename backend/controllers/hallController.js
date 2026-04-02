import { custodianAssignmentTemplate } from '../templates/emailTemplates.js'
import Hall from '../models/Hall.js'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import { sendMail } from '../utils/mailer.js'
import { logger } from '../utils/logger.js'

export const createHall = async (req, res) => {
  const { name, capacity, custodianId } = req.body
  const hall = await Hall.create({ name, capacity, custodianId: custodianId || null })
  return res.status(201).json(hall)
}

export const getHalls = async (_req, res) => {
  const halls = await Hall.find().populate('custodianId', 'name email')
  return res.json(halls)
}

export const getCustodianHalls = async (req, res) => {
  const halls = await Hall.find({ custodianId: req.user.id }).populate('custodianId', 'name email')
  return res.json(halls)
}

export const updateHall = async (req, res) => {
  const oldHall = await Hall.findById(req.params.id)
  const hall = await Hall.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('custodianId', 'name email')
  if (!hall) return res.status(404).json({ message: 'Hall not found.' })
  
  // Send email if custodian was newly assigned
  if (req.body.custodianId && oldHall.custodianId?.toString() !== req.body.custodianId) {
    const custodian = await User.findById(req.body.custodianId)
    if (custodian) {
      const token = jwt.sign({ userId: custodian._id }, process.env.JWT_SECRET, { expiresIn: '1h' })
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
      const setPasswordLink = `${frontendUrl}/set-password?token=${token}`
      
      sendMail({
        to: custodian.email,
        subject: 'You Have Been Assigned as Custodian',
        html: custodianAssignmentTemplate(custodian, hall, setPasswordLink),
      }).catch(err => logger.error({ err }, 'Custodian assignment email error'))
    }
  }
  
  return res.json(hall)
}

export const deleteHall = async (req, res) => {
  const result = await Hall.findByIdAndDelete(req.params.id)
  if (!result) return res.status(404).json({ message: 'Hall not found.' })
  return res.json({ message: 'Hall deleted.' })
}
