# Technical Documentation

Deep dive into the architecture, design patterns, and technical implementation of the Reservation System.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Authentication & Security](#authentication--security)
4. [API Design Patterns](#api-design-patterns)
5. [Frontend Architecture](#frontend-architecture)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

---

## Architecture Overview

### System Design

```
┌─────────────────┐
│   React SPA     │
│   (Frontend)    │  localhost:5173
└────────┬────────┘
         │ HTTP/AJAX
         │
    ┌────▼──────┐
    │   CORS    │
    └────┬──────┘
         │
┌────────▼──────────────┐
│   Express.js API      │  localhost:4000
│   (Backend)           │
├───────────────────────┤
│ • Routes              │
│ • Controllers         │
│ • Middleware          │
│ • Validation (Zod)    │
│ • Authentication      │
└───────┬────────────────┘
        │ TCP
┌───────▼──────────────┐
│   MongoDB Atlas      │
│   (Database)         │
└──────────────────────┘

    ┌─────────────────────┐
    │  Nodemailer SMTP    │
    │  (Email Service)    │
    └─────────────────────┘
```

### Request/Response Flow

```
1. Frontend makes HTTP request with JWT token
2. Express receives request
3. CORS middleware validates origin
4. Authentication middleware verifies JWT
5. Authorization middleware checks roles
6. Zod validation checks request body
7. Controller executes business logic
8. MongoDB operations performed
9. Email notifications sent (if needed)
10. Response returned to frontend
11. Frontend updates UI
```

---

## Database Schema

### Collections with Indexes

#### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,              // unique index
  password: String,           // bcrypt hashed
  role: String,              // enum: ["student", "faculty", "admin", "custodian"]
  resetToken: String,        // SHA256 hash of reset token
  resetTokenExpiry: Date,    // expires after 24 hours
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.users.createIndex({ email: 1 }, { unique: true })
```

**Password Reset Flow:**
1. User requests password reset
2. 32-byte random token generated
3. Token SHA256 hashed and stored in `resetToken`
4. Plain token sent in email
5. User clicks email link with plain token
6. Backend hashes token and checks against stored hash
7. If matches, password updated and token cleared

---

#### Hall Collection
```javascript
{
  _id: ObjectId,
  name: String,               // unique index
  description: String,
  capacity: Number,
  pricePerHour: Number,      // in rupees/currency
  features: [String],        // ["WiFi", "Projector", "Microphone", ...]
  image: String,             // URL to hall image
  custodianId: ObjectId,     // ref: User (admin or custodian)
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.halls.createIndex({ custodianId: 1 })
db.halls.createIndex({ name: 1 }, { unique: true })
```

---

#### Slot Collection
```javascript
{
  _id: ObjectId,
  hallId: ObjectId,          // ref: Hall, indexed
  date: Date,                // stored as YYYY-MM-DD
  timeSlot: String,          // format: "HH:MM-HH:MM" (24-hour)
  isBooked: Boolean,         // true if slot is taken
  available: Number,         // count of available slots
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.slots.createIndex({ hallId: 1, date: 1, timeSlot: 1 }, { unique: true })
db.slots.createIndex({ date: 1 })
```

---

#### Booking Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,          // ref: User, indexed
  hallId: ObjectId,          // ref: Hall, indexed
  slotId: ObjectId,          // ref: Slot, indexed
  status: String,            // enum: ["Pending", "Approved", "Rejected", "Cancelled"]
  message: String,           // rejection reason or notes
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.bookings.createIndex({ userId: 1, createdAt: -1 })
db.bookings.createIndex({ hallId: 1, createdAt: -1 })
db.bookings.createIndex({ status: 1 })
db.bookings.createIndex({ userId: 1, hallId: 1, slotId: 1 }, { unique: true })  // overbooking prevention
```

**Overbooking Prevention:**
- `userId + hallId + slotId` unique compound index prevents duplicate bookings
- Before creation, duplicate check: `await Booking.findOne({ userId, hallId, slotId })`
- If exists and status not "Cancelled", reject booking

---

#### Notification Collection
```javascript
{
  _id: ObjectId,
  toUserId: ObjectId,        // ref: User, indexed
  toRole: String,            // send to specific role if needed
  message: String,
  type: String,              // "booking-request", "approval", "rejection", "cancellation"
  bookingId: ObjectId,       // ref: Booking (optional)
  isRead: Boolean,           // default: false
  createdAt: Date,
}

// Indexes
db.notifications.createIndex({ toUserId: 1, createdAt: -1 })
db.notifications.createIndex({ isRead: 1 })
```

---

## Authentication & Security

### JWT Token Structure

```javascript
// Token payload
{
  userId: "507f1f77bcf86cd799439011",
  email: "user@example.com",
  role: "student",
  iat: 1712061000,        // issued at
  exp: 1712147400         // expires in 24 hours
}

// Token secret stored in .env as JWT_SECRET
```

### Password Security

```javascript
// Password hashing (bcryptjs)
const salt = await bcrypt.genSalt(10)   // 10 rounds
const hashedPassword = await bcrypt.hash(password, salt)

// Password verification
const isMatch = await bcrypt.compare(inputPassword, hashedPassword)
```

### Reset Token Generation

```javascript
// 32-byte random token
const resetToken = crypto.randomBytes(32).toString('hex')

// SHA256 hash for storage
const resetTokenHash = crypto.createHash('sha256')
  .update(resetToken)
  .digest('hex')

// Stored in database
await User.updateOne(
  { email },
  {
    resetToken: resetTokenHash,
    resetTokenExpiry: Date.now() + 24 * 60 * 60 * 1000  // 24 hours
  }
)

// Sent to user in email
const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`
```

### CORS Configuration

```javascript
// Allowed origins
const allowedOrigins = [
  'http://localhost:5173',      // dev frontend
  'http://localhost:5174',      // alternate dev
  'http://localhost:3000',      // another port
  'http://10.91.255.232:5173',  // network IP
  process.env.FRONTEND_URL      // production frontend
]

app.use(cors({ origin: allowedOrigins }))
```

---

## API Design Patterns

### RESTful Conventions

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/resource` | List all |
| POST | `/api/resource` | Create |
| GET | `/api/resource/:id` | Get one |
| PUT | `/api/resource/:id` | Update |
| DELETE | `/api/resource/:id` | Delete |

### Request Validation with Zod

```javascript
// Define schema
import { z } from 'zod'

const bookingSchema = z.object({
  hallId: z.string().min(1, "Hall required"),
  slotId: z.string().min(1, "Slot required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
})

// Middleware
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      errors: result.error.errors
    })
  }
  req.validated = result.data
  next()
}

// Usage in route
router.post('/bookings', validate(bookingSchema), createBooking)
```

### Error Handling Pattern

```javascript
// Global error handler
app.use((err, req, res, next) => {
  logger.error({ err, path: req.path }, 'Unhandled Exception')
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.errors
    })
  }
  
  if (err.name === 'MongoServerError' && err.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate entry'
    })
  }
  
  res.status(500).json({
    message: 'Internal server error'
  })
})
```

### Middleware Chain

```javascript
// Typical route with all middleware
router.post(
  '/bookings',
  // 1. Body parsing (express.json)
  // 2. CORS check
  // 3. Authentication
  authenticate,
  // 4. Authorization (role check)
  authorize('student', 'faculty'),
  // 5. Validation
  validate(bookingSchema),
  // 6. Controller
  createBooking
)
```

---

## Frontend Architecture

### Component Hierarchy

```
App.jsx (Router setup)
├── ThemeLayout (App shell)
│   ├── Navbar
│   ├── Main Routes
│   │   ├── HomePage
│   │   ├── LoginPage
│   │   ├── RegisterPage
│   │   ├── ProfilePage
│   │   ├── ReservePage (with DatePicker, Dialog)
│   │   ├── MyBookingsPage (with CancellationDialog)
│   │   ├── HallDetailsPage
│   │   ├── SpacesPage
│   │   ├── AdminPage
│   │   └── CustodianPage
│   └── Footer
```

### State Management

```javascript
// No Redux - using React hooks for simplicity
// State stored in localStorage for persistence

// localStorage keys:
- "auth_token"        // JWT token
- "user_role"         // user role
- "user_id"           // user ID

// Per-page state: useState
// Side effects: useEffect

// API calls: custom api.js service
```

### API Service Pattern

```javascript
// src/services/api.js
export const api = axios.create({
  baseURL: config.API_URL,
  timeout: 10000
})

// Request interceptor - add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Usage in components
const { data } = await api.get('/halls')
```

### Routing & Role-Based Access

```javascript
// App.jsx routing logic
<Routes>
  {!isAuthenticated ? (
    <>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
    </>
  ) : (
    <>
      {role === 'student' || role === 'faculty' ? (
        <>
          <Route path="/" element={<HomePage />} />
          <Route path="/reserve/:hallId" element={<ReservePage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
        </>
      ) : null}
      
      {role === 'admin' ? (
        <Route path="/admin" element={<AdminPage />} />
      ) : null}
      
      {role === 'custodian' ? (
        <Route path="/custodian" element={<CustodianPage />} />
      ) : null}
    </>
  )}
</Routes>
```

---

## Error Handling

### Backend Error Codes

| Code | Meaning | Handling |
|------|---------|----------|
| 400 | Bad Request | Check validation errors, user input |
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden | Show access denied message |
| 404 | Not Found | Show 404 page |
| 409 | Conflict | Handle duplicate entries, overbooking |
| 500 | Server Error | Show generic error, contact support |

### Frontend Error Handling

```javascript
// Try-catch with user feedback
try {
  const response = await api.post('/bookings', bookingData)
  toast.success('Booking created successfully')
} catch (error) {
  if (error.response?.status === 409) {
    toast.error('This slot is already booked')
  } else if (error.response?.status === 400) {
    toast.error('Please check your input')
  } else {
    toast.error('An error occurred. Please try again.')
  }
}
```

---

## Best Practices

### Code Organization

✅ **DO:**
- Keep controllers under 200 lines
- One route file per resource
- Separate business logic from route handlers
- Use middleware for cross-cutting concerns
- Keep models clean - only schema logic

❌ **DON'T:**
- Put business logic in routes
- Create God objects (too many responsibilities)
- Mix concerns (auth + validation + business logic)
- Ignore errors or use silent failures

### Naming Conventions

```javascript
// Controllers
createBooking        // ✅
getAllBookings      // ✅
getBookingById      // ✅
updateBookingStatus // ✅
deleteBooking       // ✅

// Routes
router.get('/', getAll)              // ✅
router.post('/', create)             // ✅
router.get('/:id', getById)          // ✅
router.put('/:id', update)           // ✅
router.delete('/:id', delete)        // ✅

// Files
bookingController.js          // ✅
notificationMiddleware.js     // ✅
userValidation.js            // ✅
```

### Security Best Practices

```javascript
// ✅ Always validate input
const { error, value } = schema.validate(req.body)

// ✅ Hash passwords
const hashed = await bcrypt.hash(password, 10)

// ✅ Use HTTPS in production
// ✅ Implement rate limiting
// ✅ Sanitize data before database
// ✅ Use environment variables for secrets
// ✅ Implement CORS properly
// ✅ Validate JWT tokens
// ✅ Log security events

// ❌ Don't expose sensitive data in logs
// ❌ Don't store passwords in plain text
// ❌ Don't trust user input
// ❌ Don't hardcode secrets
```

### Performance Tips

```javascript
// ✅ Use indexes on frequently queried fields
db.bookings.createIndex({ hallId: 1, date: 1 })

// ✅ Limit query results
Booking.find().limit(50).skip((page-1)*50)

// ✅ Select only needed fields
User.findById(id, 'name email')

// ✅ Use lean() for read-only queries
Hall.find().lean()

// ✅ Implement pagination
// ✅ Cache frequently accessed data
// ✅ Use CDN for static assets
```

---

## Testing & Debugging

### Backend Logging

```javascript
// Pino logger
import { logger } from './utils/logger.js'

logger.info({ userId, bookingId }, 'Booking created')
logger.error({ err, path }, 'Request failed')
logger.debug({ data }, 'Database operation')
```

### Frontend Console Tricks

```javascript
// Debugging API calls
window.api = api  // Expose API service

// Debugging localStorage
localStorage.getItem('auth_token')
localStorage.setItem('debug_mode', 'true')

// React DevTools browser extension recommended
```

---

**For more info, see related documentation:**
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [CONTRIBUTION_GUIDE.md](CONTRIBUTION_GUIDE.md) - Code standards
