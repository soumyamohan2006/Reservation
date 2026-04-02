import 'dotenv/config'
import mongoose from 'mongoose'
import User from './models/User.js'

const adminUser = {
  name: 'Admin User',
  email: 'admin@campus.com',
  password: 'admin123',
  role: 'admin'
}

await mongoose.connect(process.env.MONGO_URI)
console.log('Connected to MongoDB')

const existing = await User.findOne({ email: adminUser.email })
if (existing) {
  console.log('Admin user already exists!')
} else {
  await User.create(adminUser)
  console.log('Admin user created successfully!')
  console.log('Email: admin@campus.com')
  console.log('Password: admin123')
}

await mongoose.disconnect()
