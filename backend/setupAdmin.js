import 'dotenv/config'
import mongoose from 'mongoose'
import User from './models/User.js'

async function setupAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB\n')

    const email = 'admin@campus.com'
    const password = 'admin123'

    // Check if admin exists
    let admin = await User.findOne({ email })

    if (admin) {
      console.log('📝 Admin account exists, updating password...')
      admin.password = password
      await admin.save()
      console.log('✅ Password updated')
    } else {
      console.log('📝 Creating new admin account...')
      admin = await User.create({
        name: 'Admin',
        email,
        password,
        role: 'admin'
      })
      console.log('✅ Admin account created')
    }

    console.log('\n📋 Login Credentials:')
    console.log(`   Email:    ${email}`)
    console.log(`   Password: ${password}`)
    console.log('\n💡 Login at: http://localhost:5173/admin-login\n')

    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

setupAdmin()
