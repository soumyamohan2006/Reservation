import Hall from '../models/Hall.js'

// POST /api/halls — admin only
export const createHall = async (req, res) => {
  const { name, capacity } = req.body
  if (!name || !capacity)
    return res.status(400).json({ message: 'name and capacity are required.' })

  try {
    const hall = await Hall.create({ name, capacity })
    return res.status(201).json(hall)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

// GET /api/halls
export const getHalls = async (_req, res) => {
  try {
    const halls = await Hall.find()
    return res.json(halls)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}
