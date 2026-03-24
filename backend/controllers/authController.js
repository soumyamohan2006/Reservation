import jwt from 'jsonwebtoken'
import User from '../models/User.js'

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
