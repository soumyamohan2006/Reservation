# Quick Start Testing Guide

Test all features of the Reservation System using curl, Postman, or manually in the UI.

---

## Table of Contents

- [Manual UI Testing](#manual-ui-testing)
- [cURL Testing](#curl-testing)
- [Postman Collection](#postman-collection)
- [Test Scenarios](#test-scenarios)

---

## Manual UI Testing

### Setup

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open `http://localhost:5173` in browser
4. Database pre-seeded with sample halls

### User Registration & Login

#### Registration
1. Click "Register" on login page
2. Fill form:
   - Name: `John Doe`
   - Email: `john@example.com`
   - Password: `SecurePass123!`
   - Role: `Student`
3. Click "Sign Up"
4. Should redirect to login page

#### Login
1. Enter email and password from registration
2. Click "Login"
3. Should redirect to homepage

### Browse & Search

#### Homepage
1. View 8 sample halls displayed
2. Each hall shows: name, capacity, price, features
3. Click "View Details" on any hall
4. See full hall information

#### Hall Details Page
1. View hall name, capacity, price, features, description
2. See calendar view of available slots
3. Click on a date to select booking date

### Booking Flow

#### Create Booking
1. Click "Book Now" on hall details
2. Select date and time slot
3. Click "Confirm Booking"
4. Should see success message
5. Booking appears in "My Bookings"

#### My Bookings
1. Click "My Bookings" in navbar
2. View all your bookings
3. See booking status (Pending, Approved, Cancelled)
4. Click "Cancel" on a pending booking
5. Confirm cancellation in dialog
6. Booking status changes to "Cancelled"

### Password Management

#### Forgot Password
1. Click "Forgot Password" on login page
2. Enter registered email
3. Check email in Mailtrap/Gmail (if configured)
4. Click reset link in email
5. Enter new password
6. Should confirm success
7. Login with new password

#### Change Password (Profile Page)
1. After login, click profile icon
2. Click "Change Password"
3. Enter current password
4. Enter new password
5. Confirm new password
6. Click "Update"
7. Success message shown

### Admin Features

#### Admin Login
1. Create user with role `admin`
2. Login with admin account
3. Redirected to admin dashboard
4. Can see: Users, Bookings, Halls statistics

#### Admin Operations
1. View all users and their info
2. View all bookings across system
3. Manage halls and pricing

### Custodian Features

#### Custodian Login
1. Create user with role `custodian`
2. Login with custodian account
3. Redirected to custodian dashboard

#### Approve/Reject Bookings
1. See pending booking requests
2. Click "Approve" or "Reject"
3. Booking status updates immediately
4. User receives email notification

---

## cURL Testing

### Prerequisites

```bash
# Base URL
export BASE_URL="http://localhost:4000/api"

# Storage for token
export TOKEN=""
```

### 1. Health Check

```bash
curl -X GET "$BASE_URL/health"
```

**Response:**
```json
{
  "ok": true,
  "service": "reservation-backend"
}
```

---

### 2. Register User

```bash
curl -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!",
    "role": "student"
  }'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Test User",
    "email": "test@example.com",
    "role": "student"
  }
}
```

---

### 3. Login

```bash
curl -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Test User",
    "role": "student"
  }
}
```

**Save token:**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 4. Get All Halls

```bash
curl -X GET "$BASE_URL/halls"
```

**Response:**
```json
{
  "halls": [
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Grand Auditorium",
      "capacity": 500,
      "pricePerHour": 5000,
      "features": ["Projector", "WiFi"],
      "description": "Large auditorium..."
    }
  ]
}
```

**Save hall ID:**
```bash
export HALL_ID="507f1f77bcf86cd799439012"
```

---

### 5. Get Hall Availability

```bash
curl -X GET "$BASE_URL/halls/$HALL_ID/availability?date=2024-04-15" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "hallId": "507f1f77bcf86cd799439012",
  "date": "2024-04-15",
  "availableSlots": [
    {
      "id": "607f1f77bcf86cd799439021",
      "timeSlot": "09:00-11:00",
      "available": 1,
      "isBooked": false
    },
    {
      "id": "607f1f77bcf86cd799439022",
      "timeSlot": "11:00-13:00",
      "available": 0,
      "isBooked": true
    }
  ]
}
```

**Save slot ID:**
```bash
export SLOT_ID="607f1f77bcf86cd799439021"
```

---

### 6. Create Booking

```bash
curl -X POST "$BASE_URL/bookings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hallId": "'$HALL_ID'",
    "slotId": "'$SLOT_ID'",
    "date": "2024-04-15"
  }'
```

**Success (201):**
```json
{
  "message": "Booking created successfully",
  "booking": {
    "id": "707f1f77bcf86cd799439031",
    "status": "Pending"
  }
}
```

**Overbooking Error (409):**
```json
{
  "message": "This slot is already booked by another user"
}
```

**Save booking ID:**
```bash
export BOOKING_ID="707f1f77bcf86cd799439031"
```

---

### 7. Get My Bookings

```bash
curl -X GET "$BASE_URL/my-bookings" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "bookings": [
    {
      "id": "707f1f77bcf86cd799439031",
      "hall": "Grand Auditorium",
      "date": "2024-04-15",
      "timeSlot": "09:00-11:00",
      "status": "Pending"
    }
  ]
}
```

---

### 8. Cancel Booking

```bash
curl -X PUT "$BASE_URL/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "No longer needed"
  }'
```

**Response (200):**
```json
{
  "message": "Booking cancelled successfully",
  "booking": {
    "id": "707f1f77bcf86cd799439031",
    "status": "Cancelled"
  }
}
```

---

### 9. Get Notifications

```bash
curl -X GET "$BASE_URL/notifications" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "807f1f77bcf86cd799439041",
      "message": "Your booking has been approved",
      "isRead": false,
      "createdAt": "2024-04-02T08:15:00Z"
    }
  ],
  "unreadCount": 1
}
```

---

### 10. Mark Notification as Read

```bash
curl -X PATCH "$BASE_URL/notifications/807f1f77bcf86cd799439041/read" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "message": "Notification marked as read"
}
```

---

### 11. Forgot Password

```bash
curl -X POST "$BASE_URL/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Response:**
```json
{
  "message": "Password reset email sent successfully"
}
```

**To get reset token (in development):**
```bash
# Check MongoDB directly or check email
# In production: check email inbox
```

---

### 12. Reset Password

```bash
curl -X POST "$BASE_URL/reset-password" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123xyz...",
    "newPassword": "NewPass456!"
  }'
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

---

## Postman Collection

### Import Collection

1. Open Postman
2. Click "File" → "Import"
3. Paste this JSON or import from URL

### Collection Template

Create a new collection with these requests:

```json
{
  "info": {
    "name": "Reservation API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/register",
            "body": {
              "mode": "raw",
              "raw": "{\"name\": \"Test\", \"email\": \"test@example.com\", \"password\": \"Test123\", \"role\": \"student\"}"
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/login",
            "body": {
              "mode": "raw",
              "raw": "{\"email\": \"test@example.com\", \"password\": \"Test123\"}"
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:4000/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

### Setup in Postman

1. Set environment variables:
   - `base_url`: `http://localhost:4000/api`
   - `token`: (will be set after login)

2. Create requests for each endpoint
3. Use `{{base_url}}` and `{{token}}` in requests

---

## Test Scenarios

### Scenario 1: Normal Booking Flow

1. **Register** as student
2. **Login** with student account
3. **Get halls** - verify 8 halls returned
4. **Get availability** - select a date
5. **Create booking** - book a slot
6. **Get my bookings** - verify booking appears
7. **Logout**

**Expected:** No errors, booking in "Pending" status

---

### Scenario 2: Overbooking Prevention

1. **User A:** Register and login
2. **User A:** Create booking for Auditorium, 2024-04-15, 09:00-11:00
3. **User B:** Register and login
4. **User B:** Try to book same slot
5. **User B:** Should get error: "This slot is already booked"

**Expected:** Overbooking prevented

---

### Scenario 3: Password Reset

1. **Register** user with email
2. **Logout**
3. **Click "Forgot Password"**
4. **Enter email**
5. **Check email** for reset link
6. **Click reset link**
7. **Enter new password**
8. **Login** with new password

**Expected:** Password reset successful, login works

---

### Scenario 4: Booking Cancellation

1. **Create booking**
2. **Go to "My Bookings"**
3. **Click "Cancel"**
4. **Confirm cancellation**
5. **Check status** - should be "Cancelled"
6. **Verify** slot is available for others

**Expected:** Booking cancelled, slot available

---

### Scenario 5: Role-Based Access

1. **Student:** Can access only homepage, booking, profile
2. **Faculty:** Same as student
3. **Admin:** Redirected to `/admin` dashboard
4. **Custodian:** Redirected to `/custodian` portal

**Expected:** Role-based redirects work correctly

---

## Performance Testing

### Load Testing (Optional)

```bash
# Using Apache Bench
ab -n 100 -c 10 http://localhost:4000/api/halls

# Output shows:
# - Requests per second
# - Average response time
# - Failed requests
```

### Database Performance

```bash
# Check slow queries in MongoDB
db.setProfilingLevel(1)
db.system.profile.find().limit(5).sort({ millis: -1 })
```

---

## Troubleshooting

### Test Fails: "Cannot POST /api/register"
- Backend not running
- Wrong port (should be 4000)
- Check `backend/index.js` for route definitions

### Test Fails: "Invalid email or password"
- Email not registered
- Password incorrect
- Check MongoDB data

### Test Fails: "Overbooking check not working"
- Unique index might not be created
- Run: `db.bookings.getIndexes()`
- Recreate index if missing

### Email not received
- Check `.env` email credentials
- Use Mailtrap (free email testing)
- Set `EMAIL_USER` and `EMAIL_PASS`

---

## Success Indicators

All tests passing? ✅

- [ ] Registration works
- [ ] Login returns JWT token
- [ ] Halls API returns data
- [ ] Bookings created successfully
- [ ] Overbooking is prevented
- [ ] Cancellation works
- [ ] Password reset emailed
- [ ] Notifications created
- [ ] Role-based access works
- [ ] UI responsive on mobile

---

**Ready to test! Happy testing! 🧪**
