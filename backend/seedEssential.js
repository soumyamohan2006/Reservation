import 'dotenv/config'
import mongoose from 'mongoose'
import User from './models/User.js'
import Hall from './models/Hall.js'

// Essential data to recreate if database is empty
const essentialData = {
  users: [
    {
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@campus.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin'
    },
    {
      name: 'Custodian',
      email: process.env.CUSTODIAN_EMAIL || 'custodian@campus.com',
      password: process.env.CUSTODIAN_PASSWORD || 'custodian123',
      role: 'custodian'
    }
  ],
  halls: [
    {
      name: 'Auditorium',
      capacity: 500,
      custodianId: null
    },
    {
      name: 'Seminar Hall',
      capacity: 200,
      custodianId: null
    },
    {
      name: 'CGPC Hall',
      capacity: 50,
      custodianId: null
    }
  ]
}

async function seedEssentialData() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB\n')

    // Check if data already exists
    const userCount = await User.countDocuments()
    const hallCount = await Hall.countDocuments()

    console.log(`Current database state:`)
    console.log(`  - Users: ${userCount}`)
    console.log(`  - Halls: ${hallCount}\n`)

    // Seed users
    console.log('📝 Creating essential users...')
    for (const userData of essentialData.users) {
      try {
        const exists = await User.findOne({ email: userData.email })
        if (!exists) {
          await User.create(userData)
          console.log(`   ✅ Created ${userData.role}: ${userData.email}`)
        } else {
          console.log(`   ⏭️  ${userData.role} already exists: ${userData.email}`)
        }
      } catch (err) {
        console.log(`   ❌ Failed to create ${userData.email}: ${err.message}`)
      }
    }

    // Seed halls
    console.log('\n📝 Creating essential halls...')
    for (const hallData of essentialData.halls) {
      try {
        const exists = await Hall.findOne({ name: hallData.name })
        if (!exists) {
          await Hall.create(hallData)
          console.log(`   ✅ Created hall: ${hallData.name}`)
        } else {
          console.log(`   ⏭️  Hall already exists: ${hallData.name}`)
        }
      } catch (err) {
        console.log(`   ❌ Failed to create ${hallData.name}: ${err.message}`)
      }
    }

    console.log('\n🎉 Essential data seeded successfully!')
    console.log('\n📋 Login credentials:')
    console.log(`   Admin: ${essentialData.users[0].email} / ${essentialData.users[0].password}`)
    console.log(`   Custodian: ${essentialData.users[1].email} / ${essentialData.users[1].password}`)

    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error('❌ Seeding failed:', err.message)
    process.exit(1)
  }
}

seedEssentialData()
