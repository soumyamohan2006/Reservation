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
      
      const defaultTimeSlot = timeSlot || '8AM-10PM'
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
      
      const hall = await Hall.findById(hallId)
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
      const skipped = totalDays - slots.length
      
      return res.status(201).json({ 
        message: `Generated ${slots.length} slot(s) for ${hall?.name || 'hall'} (${startDate} to ${endDate}, ${defaultTimeSlot})${skipped > 0 ? `. Skipped ${skipped} duplicate(s).` : ''}`,
        count: slots.length,
        skipped
      })
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

export const getAllSlots = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10))
    const skip = (page - 1) * limit

    const [slots, total] = await Promise.all([
      Slot.find().populate('hallId', 'name capacity').sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
      Slot.countDocuments()
    ])

    return res.json({ slots, total, page, totalPages: Math.ceil(total / limit) })
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
    const now = new Date()
    const filter = { isBooked: false, $or: [{ lockedUntil: null }, { lockedUntil: { $lte: now } }, { lockedBy: req.user.id }] }
    if (hallId) filter.hallId = hallId
    if (date) filter.date = date
    
    console.log('Available slots query:', { hallId, date, userId: req.user.id })
    const slots = await Slot.find(filter).populate('hallId', 'name capacity')
    console.log(`Found ${slots.length} available slots`)
    
    return res.json(slots)
  } catch (err) {
    console.error('getAvailableSlots error:', err)
    return res.status(500).json({ message: err.message })
  }
}

export const lockSlot = async (req, res) => {
  try {
    const now = new Date()
    const slot = await Slot.findById(req.params.id)
    if (!slot) return res.status(404).json({ message: 'Slot not found.' })
    if (slot.isBooked) return res.status(409).json({ message: 'Slot already booked.' })
    // Check if locked by someone else and lock is still valid
    if (slot.lockedBy && slot.lockedBy.toString() !== req.user.id && slot.lockedUntil > now)
      return res.status(409).json({ message: 'Slot is currently selected by another user.' })
    slot.lockedBy = req.user.id
    slot.lockedUntil = new Date(now.getTime() + 5 * 60 * 1000) // 5 min lock
    await slot.save()
    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

export const unlockSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id)
    if (!slot) return res.status(404).json({ message: 'Slot not found.' })
    if (slot.lockedBy?.toString() === req.user.id) {
      slot.lockedBy = null
      slot.lockedUntil = null
      await slot.save()
    }
    return res.json({ ok: true })
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

// Bulk delete slots by criteria
export const bulkDeleteSlots = async (req, res) => {
  const { hallId, timeSlot, startDate, endDate } = req.body
  
  try {
    const filter = {}
    if (hallId) filter.hallId = hallId
    if (timeSlot) filter.timeSlot = timeSlot
    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate }
    } else if (startDate) {
      filter.date = { $gte: startDate }
    } else if (endDate) {
      filter.date = { $lte: endDate }
    }
    
    console.log('Bulk delete filter:', filter)
    const result = await Slot.deleteMany(filter)
    console.log('Deleted count:', result.deletedCount)
    return res.json({ message: `Deleted ${result.deletedCount} slot(s).`, count: result.deletedCount })
  } catch (err) {
    console.error('Bulk delete error:', err)
    return res.status(500).json({ message: err.message })
  }
}

export const getAllSlotsForDate = async (req, res) => {
  const { hallId, date } = req.query
  if (!hallId || !date) return res.status(400).json({ message: 'hallId and date are required.' })
  try {
    const now = new Date()
    const Booking = (await import('../models/Booking.js')).default
    const slots = await Slot.find({ hallId, date })
    console.log('getAllSlotsForDate:', { hallId, date, foundSlots: slots.length, slots: slots.map(s => ({ id: s._id?.toString(), timeSlot: s.timeSlot, isBooked: s.isBooked, hallId: s.hallId?.toString() })) })
    const pendingBookings = await Booking.find({ hallId, slotId: { $in: slots.map(s => s._id) }, status: { $in: ['Pending', 'CustodianApproved'] } })
    const pendingSlotIds = new Set(pendingBookings.map(b => b.slotId.toString()))
    const result = slots.map(s => {
      let status
      if (s.isBooked) {
        status = 'Booked'
      } else if (pendingSlotIds.has(s._id.toString())) {
        status = 'Pending'
      } else if (s.lockedBy && s.lockedUntil && s.lockedUntil > now && s.lockedBy.toString() !== req.user.id) {
        status = 'Locked'
      } else {
        status = 'Available'
      }
      return {
        _id: s._id,
        timeSlot: s.timeSlot,
        date: s.date,
        status,
      }
    })
    result.sort((a, b) => {
      const toMin = t => { const m = t.match(/^(\d+)(AM|PM)/i); if (!m) return 0; let h = parseInt(m[1]); if (m[2].toUpperCase() === 'PM' && h !== 12) h += 12; if (m[2].toUpperCase() === 'AM' && h === 12) h = 0; return h * 60 }
      return toMin(a.timeSlot.split('-')[0]) - toMin(b.timeSlot.split('-')[0])
    })
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

export const getBookedSlots = async (req, res) => {
  const { hallId, date } = req.query
  try {
    const filter = { isBooked: true }
    if (hallId) filter.hallId = hallId
    if (date) filter.date = date
    const slots = await Slot.find(filter).select('timeSlot date hallId')
    return res.json(slots)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

export const blockSlot = async (req, res) => {
  try {
    const slot = await Slot.findByIdAndUpdate(req.params.id, { isBooked: true, lockedBy: null, lockedUntil: null }, { new: true })
    if (!slot) return res.status(404).json({ message: 'Slot not found.' })
    return res.json({ message: 'Slot blocked.', slot })
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
