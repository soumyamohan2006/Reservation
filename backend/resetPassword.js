import 'dotenv/config'
import mongoose from 'mongoose'
import User from './models/User.js'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB\n')

    // List all admin users
    const admins = await User.find({ role: 'admin' })
    
    if (admins.length === 0) {
      console.log('❌ No admin users found in database!')
      console.log('Run: npm run fix-db to create admin account\n')
      process.exit(1)
    }

    console.log('📋 Admin users found:')
    admins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.name} (${admin.email})`)
    })
    console.log('')

    const choice = await question('Select admin number to reset password (or press Enter for first): ')
    const selectedIndex = choice ? parseInt(choice) - 1 : 0
    
    if (selectedIndex < 0 || selectedIndex >= admins.length) {
      console.log('❌ Invalid selection')
      process.exit(1)
    }

    const admin = admins[selectedIndex]
    console.log(`\n🔧 Resetting password for: ${admin.name} (${admin.email})`)
    
    const newPassword = await question('Enter new password (or press Enter for "admin123"): ')
    const password = newPassword || 'admin123'

    admin.password = password
    await admin.save()

    console.log('\n✅ Password reset successfully!')
    console.log(`\n📋 Login Credentials:`)
    console.log(`   Email:    ${admin.email}`)
    console.log(`   Password: ${password}`)
    console.log(`\n💡 You can now login at: http://localhost:5173/admin-login\n`)

    rl.close()
    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error('❌ Error:', err.message)
    rl.close()
    process.exit(1)
  }
}

resetPassword()
