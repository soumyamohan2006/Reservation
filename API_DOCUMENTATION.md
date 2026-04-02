# API Documentation

Complete reference for all REST API endpoints in the Reservation System.

**Base URL:** `http://localhost:4000/api`  
**Authentication:** JWT Token in `Authorization: Bearer <token>` header

---

## Authentication Endpoints

### Register User
Create a new user account.

```
POST /register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "student" // student, faculty, admin, custodian
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

---

### Login
Authenticate and receive JWT token.

```
POST /login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

**Error (401):**
```json
{
  "message": "Invalid email or password"
}
```

---

### Forgot Password
Request password reset token via email.

```
POST /forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent successfully"
}
```

**The email will contain a link like:**
```
https://yourdomain.com/reset-password?token=abc123xyz
```

---

### Reset Password
Reset password using token from email.

```
POST /reset-password
Content-Type: application/json

{
  "token": "abc123xyz",
  "newPassword": "NewSecurePass456!"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

---

### Set Password (Custodian Only)
First-time password setup for custodians.

```
POST /set-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "tempPassword123",
  "newPassword": "MyNewSecurePassword!"
}
```

**Response (200):**
```json
{
  "message": "Password updated successfully"
}
```

---

## Hall Endpoints

### Get All Halls
Retrieve list of all available halls.

```
GET /halls
```

**Response (200):**
```json
{
  "halls": [
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Grand Auditorium",
      "description": "Large auditorium for major events",
      "capacity": 500,
      "pricePerHour": 5000,
      "features": ["Projector", "Microphone", "WiFi"],
      "image": "https://...",
      "custodianId": "507f1f77bcf86cd799439001"
    },
    // ... more halls
  ]
}
```

---

### Get Hall Details
Get specific hall information.

```
GET /halls/:hallId
```

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439012",
  "name": "Grand Auditorium",
  "description": "Large auditorium for major events",
  "capacity": 500,
  "pricePerHour": 5000,
  "features": ["Projector", "Microphone", "WiFi"],
  "image": "https://...",
  "custodian": {
    "id": "507f1f77bcf86cd799439001",
    "name": "Manager Name",
    "email": "manager@example.com"
  }
}
```

---

### Get Hall Availability
Check available time slots for a specific hall and date.

```
GET /halls/:hallId/availability?date=2024-04-15
```

**Response (200):**
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

---

## Booking Endpoints

### Create Booking
Create a new booking for a hall.

```
POST /bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "hallId": "507f1f77bcf86cd799439012",
  "slotId": "607f1f77bcf86cd799439021",
  "date": "2024-04-15"
}
```

**Response (201):**
```json
{
  "message": "Booking created successfully",
  "booking": {
    "id": "707f1f77bcf86cd799439031",
    "userId": "507f1f77bcf86cd799439011",
    "hallId": "507f1f77bcf86cd799439012",
    "slotId": "607f1f77bcf86cd799439021",
    "status": "Pending",
    "createdAt": "2024-04-01T10:30:00Z"
  }
}
```

**Error (400) - Overbooking Prevention:**
```json
{
  "message": "This slot is already booked by another user"
}
```

---

### Get All Bookings
Get all bookings (admin only).

```
GET /bookings
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "bookings": [
    {
      "id": "707f1f77bcf86cd799439031",
      "user": { "id": "...", "name": "John Doe", "email": "john@example.com" },
      "hall": { "id": "...", "name": "Grand Auditorium" },
      "status": "Pending",
      "createdAt": "2024-04-01T10:30:00Z"
    }
  ],
  "total": 45
}
```

---

### Get My Bookings
Get user's own bookings.

```
GET /my-bookings
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "bookings": [
    {
      "id": "707f1f77bcf86cd799439031",
      "hall": "Grand Auditorium",
      "date": "2024-04-15",
      "timeSlot": "09:00-11:00",
      "status": "Approved",
      "createdAt": "2024-04-01T10:30:00Z"
    }
  ]
}
```

---

### Cancel Booking
Cancel an existing booking.

```
PUT /bookings/:bookingId
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "No longer needed" // optional
}
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

### Get Bookings by Hall and Date
Get all bookings for a specific hall on a date.

```
GET /bookings?hallId=507f1f77bcf86cd799439012&date=2024-04-15
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "bookings": [
    {
      "id": "707f1f77bcf86cd799439031",
      "user": { "name": "John Doe" },
      "timeSlot": "09:00-11:00",
      "status": "Approved"
    }
  ]
}
```

---

## Notification Endpoints

### Get Notifications
Get user's notifications.

```
GET /notifications
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "notifications": [
    {
      "id": "807f1f77bcf86cd799439041",
      "message": "Your booking for Grand Auditorium has been approved",
      "isRead": false,
      "createdAt": "2024-04-02T08:15:00Z"
    },
    {
      "id": "807f1f77bcf86cd799439042",
      "message": "Booking request from John Doe pending your approval",
      "isRead": true,
      "createdAt": "2024-04-01T14:22:00Z"
    }
  ],
  "unreadCount": 3
}
```

---

### Mark Notification as Read
Mark a notification as read.

```
PATCH /notifications/:notificationId/read
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Notification marked as read",
  "notification": {
    "id": "807f1f77bcf86cd799439041",
    "isRead": true
  }
}
```

---

### Delete Notification
Delete a notification.

```
DELETE /notifications/:notificationId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Notification deleted successfully"
}
```

---

## User Endpoints

### Get User Profile
Get current user's profile.

```
GET /users/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "createdAt": "2024-03-15T10:30:00Z"
  }
}
```

---

### Update User Profile
Update user information.

```
PUT /users/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

---

### Change Password
Change user's password.

```
POST /users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

---

## Public Endpoints

### Health Check
Check if API is running.

```
GET /health
```

**Response (200):**
```json
{
  "ok": true,
  "service": "reservation-backend"
}
```

---

### Booking Action via Email
Direct approve/reject booking from email link (no auth required).

```
GET /booking-action/:bookingId?action=approve
GET /booking-action/:bookingId?action=reject
```

**Response (200):**
Redirects to success page: `/booking-action-success?action=approve&bookingId=...`

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "An error occurred. Please try again later"
}
```

---

## Rate Limiting

- **General endpoints:** 100 requests per 15 minutes per IP
- **Auth endpoints:** 5 requests per 15 minutes per IP
- **Email endpoints:** 3 requests per 15 minutes per IP

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:4000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Test123!",
    "role": "student"
  }'
```

### Login
```bash
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Test123!"
  }'
```

### Get Halls
```bash
curl http://localhost:4000/api/halls
```

### Get My Bookings
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:4000/api/my-bookings
```

---

**For Postman collection import:** Use the endpoints above to create requests in Postman or see [QUICK_START_TESTING.md](QUICK_START_TESTING.md)
