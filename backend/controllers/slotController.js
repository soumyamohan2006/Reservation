import Slot from '../models/Slot.js'
import Hall from '../models/Hall.js'

export const createSlot = async (req, res) => {
  const { hallId, date, timeSlot, isBooked, startDate, endDate } = req.body
  
  // Bulk generation mode: startDate + endDate
  if (startDate && endDate) {
    if (!hallId) return res.status(400).json({ message: 'hallId is required for bulk generation.' })
    
    try {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      if (start > end) return res.status(400).json({ message: 'startDate must be before endDate.' })
      
      const defaultTimeSlot = timeSlot || '8PM-10PM'
      const slots = []
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]
        
        // Check if slot already exists
        const exists = await Slot.findOne({ hallId, date: dateStr, timeSlot: defaultTimeSlot })
        if (!exists) {
          const slot = await Slot.create({ hallId, date: dateStr, timeSlot: defaultTimeSlot, isBooked: isBooked || false })
          slots.push(slot)
        }
      }
      
      const populated = await Slot.find({ _id: { $in: slots.map(s => s._id) } }).populate('hallId', 'name capacity')
      return res.status(201).json({ message: `Generated ${slots.length} slot(s).`, slots: populated })
    } catch (err) {
      return res.status(500).json({ message: err.message })
    }
  }
  
  // Single slot creation mode
  if (!hallId || !date || !timeSlot)
    return res.status(400).json({ message: 'hallId, date and timeSlot are required.' })
  try {
    const slot = await Slot.create({ hallId, date, timeSlot, isBooked: isBooked || false })
    const populated = await slot.populate('hallId', 'name capacity')
    return res.status(201).json(populated)
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: 'Slot already exists for this hall/date/time.' })
    return res.status(500).json({ message: err.message })
  }
}

export const getAllSlots = async (_req, res) => {
  try {
    return res.json(await Slot.find().populate('hallId', 'name capacity'))
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

export const getCustodianSlots = async (req, res) => {
  try {
    const halls = await Hall.find({ custodianId: req.user.id })
    const hallIds = halls.map(h => h._id)
    const slots = await Slot.find({ hallId: { $in: hallIds } }).populate('hallId', 'name capacity')
    return res.json(slots)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

export const getAvailableSlots = async (req, res) => {
  const { hallId, date } = req.query
  try {
    const filter = { isBooked: false }
    if (hallId) filter.hallId = hallId
    if (date) filter.date = date
    return res.json(await Slot.find(filter).populate('hallId', 'name capacity'))
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

export const deleteSlot = async (req, res) => {
  try {
    const slot = await Slot.findByIdAndDelete(req.params.id)
    if (!slot) return res.status(404).json({ message: 'Slot not found.' })
    return res.json({ message: 'Slot deleted.' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

// Fixes slots where hallId was saved as a plain string instead of ObjectId
export const fixSlotHallIds = async (_req, res) => {
  try {
    const halls = await Hall.find()
    let fixed = 0

    for (const hall of halls) {
      // Use updateMany with $set directly to bypass Mongoose casting issues
      const result = await Slot.collection.updateMany(
        { hallId: hall.name },           // match slots where hallId is the hall name string
        { $set: { hallId: hall._id } }   // replace with real ObjectId
      )
      fixed += result.modifiedCount

      // Also try case-insensitive variants
      const resultLower = await Slot.collection.updateMany(
        { hallId: hall.name.toLowerCase() },
        { $set: { hallId: hall._id } }
      )
      fixed += resultLower.modifiedCount
    }

    return res.json({ message: `Fixed ${fixed} slot(s). Refresh the page to see updated names.` })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}
