import 'dotenv/config'
import mongoose from 'mongoose'
import Hall from '../models/Hall.js'
import { connectDB } from '../config/db.js'

const sampleHalls = [
  {
    name: 'Grand Auditorium',
    description: 'Large auditorium perfect for conferences, seminars, and major events with state-of-the-art presentation facilities',
    capacity: 500,
    pricePerHour: 5000,
    features: ['Projector', 'Microphone System', 'WiFi', 'Sound System', 'Accessible'],
    image: 'https://images.unsplash.com/photo-1519420573924-65d60295592f?w=500&h=300&fit=crop'
  },
  {
    name: 'Executive Board Room',
    description: 'Modern boardroom with comfortable seating and conference technology for strategic meetings',
    capacity: 30,
    pricePerHour: 2000,
    features: ['Video Conference', 'WiFi', 'Whiteboard', 'Air Conditioning'],
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop'
  },
  {
    name: 'Seminar Hall A',
    description: 'Well-equipped seminar hall ideal for training sessions, workshops, and team meetings',
    capacity: 150,
    pricePerHour: 2500,
    features: ['Projector', 'WiFi', 'Breakout Area', 'Pantry'],
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop'
  },
  {
    name: 'Seminar Hall B',
    description: 'Flexible seminar space with modular seating arrangements for collaborative sessions',
    capacity: 120,
    pricePerHour: 2000,
    features: ['WiFi', 'Breakout Area', 'Whiteboard', 'Catering Available'],
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop'
  },
  {
    name: 'Conference Room 1',
    description: 'Professional meeting space with modern audiovisual equipment and comfortable layout',
    capacity: 50,
    pricePerHour: 1500,
    features: ['Video Conference', 'Projector', 'WiFi', 'Air Conditioning'],
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop'
  },
  {
    name: 'Conference Room 2',
    description: 'Intimate meeting room suitable for client presentations and discussions',
    capacity: 40,
    pricePerHour: 1200,
    features: ['Whiteboard', 'WiFi', 'Air Conditioning'],
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop'
  },
  {
    name: 'Training Lab',
    description: 'Equipped training facility with hands-on workstations and instructor setup',
    capacity: 80,
    pricePerHour: 3000,
    features: ['Computer Stations', 'WiFi', 'Dual Displays', 'Printer'],
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop'
  },
  {
    name: 'Multipurpose Hall',
    description: 'Versatile space that can be configured for lectures, exhibitions, or networking events',
    capacity: 300,
    pricePerHour: 4000,
    features: ['Modular Layout', 'Stage', 'Sound System', 'Lighting Control', 'WiFi'],
    image: 'https://images.unsplash.com/photo-1519420573924-65d60295592f?w=500&h=300&fit=crop'
  }
]

const seedHalls = async () => {
  try {
    // Connect to database
    await connectDB()
    console.log('✓ Connected to MongoDB')

    // Clear existing halls (optional - comment out to keep existing data)
    // const deleted = await Hall.deleteMany({})
    // console.log(`✓ Cleared ${deleted.deletedCount} existing halls`)

    // Insert new halls
    const inserted = await Hall.insertMany(sampleHalls, { ordered: false })
    console.log(`✓ Successfully added ${inserted.length} sample halls to database`)
    
    // Display inserted halls
    console.log('\nInserted Halls:')
    inserted.forEach((hall, idx) => {
      console.log(`${idx + 1}. ${hall.name} (${hall.capacity} capacity) - ₹${hall.pricePerHour}/hr`)
    })

    process.exit(0)
  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠ Some halls already exist. Run with --force flag to replace them.')
      console.log('Available halls:', error.writeErrors?.map(e => e.err.op.name) || 'N/A')
    } else {
      console.error('✗ Error seeding halls:', error.message)
    }
    process.exit(1)
  }
}

seedHalls()
