# 🏛️ Reservation System

> A comprehensive university/venue hall reservation management system with advanced features including password reset, booking cancellation, overbooking prevention, and real-time notifications.

**Original Repository:** [soumyamohan2006/Reservation](https://github.com/soumyamohan2006/Reservation)  
**Your Fork:** [AAYUSH9988/Reservation](https://github.com/AAYUSH9988/Reservation)

**Live Demo:** [reservation-rho-eight.vercel.app](https://reservation-rho-eight.vercel.app/)

---

## ✨ Features

### Core Functionality
- ✅ **Unified Authentication** - Single login page with role-based routing (Student, Faculty, Admin, Custodian)
- ✅ **Password Management** - Forgot password → Email verification → Reset with token
- ✅ **Hall Booking System** - Browse, search, and book available halls with time slots
- ✅ **Availability Calendar** - Real-time calendar view showing booked/available slots
- ✅ **User Profiles** - Manage personal information and change password
- ✅ **Email Notifications** - Automated emails for booking requests, approvals, and custodian assignments

### Advanced Features (Your Additions)
- 🔒 **Overbooking Prevention** - Duplicate booking validation to prevent double-bookings
- ❌ **Booking Cancellation** - Users can cancel bookings with confirmation dialog
- 📧 **Email-Based Approvals** - Direct approve/reject links in email for custodians
- 🔔 **In-App Notifications** - Notification system with read/unread status tracking
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices
- 🎨 **Modern UI** - Tailwind CSS with Lucide icons and smooth interactions

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm 8+
- MongoDB database (local or Atlas)
- Environment variables configured

### Installation

```bash
# Clone your fork
git clone https://github.com/AAYUSH9988/Reservation.git
cd Reservation

# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Create .env files
# backend/.env
PORT=4000
MONGO_URI=mongodb://...
JWT_SECRET=your_secret_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# frontend/.env (or .env.local)
VITE_API_URL=http://localhost:4000/api
```

### Running Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on `http://localhost:4000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

### Build for Production

```bash
# Frontend
cd frontend
npm run build

# Backend runs as-is (just set NODE_ENV=production)
```

---

## 📁 Project Structure

```
Reservation/
├── backend/                 # Express.js API server
│   ├── controllers/        # Business logic (auth, bookings, notifications, etc.)
│   ├── routes/             # API endpoint definitions
│   ├── models/             # MongoDB schemas (User, Booking, Hall, etc.)
│   ├── middleware/         # Authentication, validation
│   ├── config/             # Database connection
│   ├── jobs/               # Background tasks (slot cleanup)
│   ├── scripts/            # Seed data, migrations
│   ├── templates/          # Email HTML templates
│   ├── utils/              # Logger, mailer
│   ├── index.js            # Express app entry
│   └── package.json
│
├── frontend/                # React + Vite SPA
│   ├── src/
│   │   ├── pages/          # Page components (Login, HomePage, AdminPage, etc.)
│   │   ├── components/     # Reusable UI components (Button, Dialog, DatePicker)
│   │   ├── hooks/          # Custom hooks (useBackendWakeup)
│   │   ├── services/       # API client (api.js with 50+ endpoints)
│   │   ├── App.jsx         # Main app with routes
│   │   ├── main.jsx        # Entry point
│   │   ├── config.js       # Environment configuration
│   │   └── index.css       # Tailwind styles
│   ├── public/             # Static assets
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── README.md               # This file
├── DEPLOYMENT.md           # Deployment guide (Vercel, Render)
└── .gitignore
```

---

## 🔑 API Overview

### Authentication Routes
- `POST /api/register` - User registration
- `POST /api/login` - User login (returns JWT)
- `POST /api/set-password` - Custodian first-time password setup
- `POST /api/forgot-password` - Request password reset token
- `POST /api/reset-password` - Reset password with token

### Booking Routes
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create new booking (with overbooking check)
- `GET /api/my-bookings` - Get user's bookings
- `PUT /api/bookings/:id` - Cancel booking
- `GET /api/bookings?hallId=X&date=Y` - Get bookings by hall/date

### Hall Routes
- `GET /api/halls` - List all halls
- `GET /api/halls/:id` - Get hall details
- `GET /api/halls/:id/availability?date=YYYY-MM-DD` - Check availability

### Notification Routes
- `GET /api/notifications` - Get user's notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### User Routes
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile
- `POST /api/users/change-password` - Change password

**⚠️ Full API documentation:** See [DEPLOYMENT.md](DEPLOYMENT.md) and [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

---

## 👥 User Roles

| Role | Access | Capabilities |
|------|--------|--------------|
| **Student** | Booking portal | Browse halls, book slots, view/cancel bookings, see notifications |
| **Faculty** | Booking portal | Same as student, can book multiple slots |
| **Admin** | Admin dashboard | Manage halls, users, view all bookings, system settings |
| **Custodian** | Custodian portal | Approve/reject booking requests, manage assigned halls |

All roles use the **same login page** (`/login`) with role-based routing.

---

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (student|faculty|admin|custodian),
  resetToken: String (SHA256 hash),
  resetTokenExpiry: Date,
  createdAt: Date
}
```

### Booking Model
```javascript
{
  userId: ObjectId (ref: User),
  hallId: ObjectId (ref: Hall),
  slotId: ObjectId (ref: Slot),
  status: String (Pending|Approved|Rejected|Cancelled),
  message: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Hall Model
```javascript
{
  name: String (unique),
  description: String,
  capacity: Number,
  pricePerHour: Number,
  features: [String],
  image: String (URL),
  custodianId: ObjectId (ref: User),
  timestamps: Dates
}
```

### Slot Model
```javascript
{
  hallId: ObjectId (ref: Hall),
  date: Date,
  timeSlot: String,
  isBooked: Boolean,
  available: Number
}
```

**See** [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) for detailed schema documentation.

---

## 🔄 Key Workflows

### Booking a Hall
1. User browses halls on homepage or hall details page
2. Selects date and time slot
3. System checks availability and prevents overbooking
4. Booking created with "Pending" status
5. Custodian receives email notification with approve/reject links
6. User receives confirmation/rejection email
7. Booking status updated in database and UI

### Password Reset
1. User clicks "Forgot Password" on login page
2. Enters email address
3. System generates 32-byte token, sends via email
4. User clicks reset link in email
5. Enters new password
6. Token validated and password updated in database
7. User can login with new password

### Booking Cancellation
1. User views "My Bookings" page
2. Clicks "Cancel" on a pending booking
3. Confirmation dialog appears
4. Upon confirmation, booking status → "Cancelled"
5. Custodian receives cancellation notification
6. Hall slot becomes available immediately

---

## 🧪 Testing with Sample Data

The database is pre-seeded with 8 sample halls:
```bash
# Run seeder script
cd backend
node scripts/seedSampleHalls.js
```

Sample halls:
- Grand Auditorium (500 capacity, ₹5000/hr)
- Seminar Hall A & B (150 & 120 capacity, ₹2000-2500/hr)
- Conference Rooms 1 & 2 (30-50 capacity, ₹1200-1500/hr)
- Executive Board Room (30 capacity, ₹2000/hr)
- Training Lab (80 capacity, ₹3000/hr)
- Multipurpose Hall (300 capacity, ₹4000/hr)

---

## 📦 Tech Stack

### Frontend
- **React 18+** - UI framework
- **Vite** - Lightning-fast build tool
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS
- **Lucide React** - Icon library
- **React Hot Toast** - Notifications
- **date-fns** - Date manipulation
- **Zod** - Schema validation
- **Axios** - HTTP client

### Backend
- **Express.js** - Web framework
- **MongoDB** - Document database
- **Mongoose** - ODM
- **JWT** - Authentication tokens
- **Bcryptjs** - Password hashing
- **Nodemailer** - Email service
- **Zod** - Data validation
- **Pino** - Logger

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
```

### Backend (Render/Railway)
Push to GitHub and Render auto-deploys from main branch.

**Detailed deployment guide:** See [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📝 Documentation Files

| File | Purpose |
|------|---------|
| [README.md](README.md) | Project overview (this file) |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deployment to Vercel, Render, Railway |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | Complete API endpoint reference |
| [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) | Architecture, database schema, code patterns |
| [CONTRIBUTION_GUIDE.md](CONTRIBUTION_GUIDE.md) | Coding standards, how to contribute |
| [QUICK_START_TESTING.md](QUICK_START_TESTING.md) | Testing guide with curl/Postman examples |

---

## 🐛 Troubleshooting

### Backend won't connect to MongoDB
- Check `MONGO_URI` in `.env`
- Verify MongoDB server is running
- Check IP whitelist in MongoDB Atlas

### Frontend can't reach backend
- Ensure backend is running on port 4000
- Check `VITE_API_URL` in frontend `.env`
- Verify CORS is enabled in backend

### Emails not sending
- Check `EMAIL_USER` and `EMAIL_PASS` in `.env`
- For Gmail: use App Password, not account password
- Verify SMTP settings match mail provider

### Build fails
- Clear node_modules: `rm -rf node_modules && npm install`
- Update Node.js to 16+
- Check for TypeScript errors: `npx tsc --noEmit`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

**See** [CONTRIBUTION_GUIDE.md](CONTRIBUTION_GUIDE.md) for detailed guidelines.

---

## 📋 What's New in Your Fork (AAYUSH9988)

### Enhanced Features
- ✅ **Advanced Password Reset** - Email token-based secure recovery
- ✅ **Booking Cancellation** - Full cancellation workflow with notifications
- ✅ **Overbooking Prevention** - Database-level duplicate booking checks
- ✅ **Email Approvals** - Custodians can approve/reject from email
- ✅ **Notification System** - In-app + email notifications with read tracking
- ✅ **Unified Login** - Single login page for all roles (cleaner UX)

### Code Improvements
- ✅ **Better Error Handling** - Comprehensive error messages and validation
- ✅ **Modern UI Components** - Reusable Button, Dialog, DatePicker components
- ✅ **Improved Security** - Token expiry, password reset validation
- ✅ **Better Backend Organization** - Clean separation of concerns
- ✅ **Database Cleanup** - Removed unused controllers and routes

---

## 📞 Support

For questions or issues:
1. Check existing [GitHub Issues](https://github.com/AAYUSH9988/Reservation/issues)
2. Review [TROUBLESHOOTING](#-troubleshooting) section
3. [Create a new Issue](https://github.com/AAYUSH9988/Reservation/issues/new)

---

## 📄 License

This project is based on [soumyamohan2006/Reservation](https://github.com/soumyamohan2006/Reservation).

---

**Happy Booking! 🎉**
