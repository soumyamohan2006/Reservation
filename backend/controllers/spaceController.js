import Space from '../models/Space.js'
import User from '../models/User.js'

export const getAllSpaces = async (_req, res) => {
  try {
    const spaces = await Space.find().populate('custodianId', 'name email')
    return res.json(spaces)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

export const assignCustodian = async (req, res) => {
  const { hallId, custodianId } = req.body
  if (!hallId) return res.status(400).json({ message: 'hallId is required.' })
  try {
    if (custodianId) {
      const custodian = await User.findById(custodianId)
      if (!custodian || custodian.role !== 'custodian')
        return res.status(400).json({ message: 'Invalid custodian.' })
    }
    const space = await Space.findOneAndUpdate(
      { hallId },
      { custodianId: custodianId || null },
      { new: true }
    ).populate('custodianId', 'name email')
    if (!space) return res.status(404).json({ message: 'Space not found.' })
    return res.json(space)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

export const getCustodians = async (_req, res) => {
  try {
    const custodians = await User.find({ role: 'custodian' }, 'name email')
    return res.json(custodians)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}
