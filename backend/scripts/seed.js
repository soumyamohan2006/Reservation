import 'dotenv/config'
import mongoose from 'mongoose'
import Space from './models/Space.js'

const spaces = [
  {
    hallId: 'cgpc-hall',
    name: 'Auditorium',
    capacity: 500,
    description: 'Meetings, workshops, presentations',
    features: ['Projector', 'Audio System', 'Stage', 'Control Room for Technical Support'],
    image: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80',
  },
  {
    hallId: 'seminar-hall',
    name: 'Seminar Hall',
    capacity: 200,
    description: 'Seminars, conferences, guest lectures',
    features: ['Stage', 'Podium', 'Centralized AC', 'Professional Lighting'],
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
  },
  {
    hallId: 'asap-hall',
    name: 'CGPC Hall',
    capacity: 50,
    description: 'Training programs and academic sessions',
    features: ['Projector', 'AC', 'Wi-Fi', 'Audio System', 'Podium', 'Stage'],
    image: 'https://images.unsplash.com/photo-1497366412874-3415097a27e7?auto=format&fit=crop&w=1200&q=80',
  },
]

await mongoose.connect(process.env.MONGO_URI)
await Space.deleteMany()
await Space.insertMany(spaces)
console.log('Spaces seeded successfully.')
await mongoose.disconnect()
