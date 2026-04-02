# Contribution Guide

Thank you for considering contributing to the Reservation System! This guide will help you get started.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Bug Reports](#bug-reports)
- [Feature Requests](#feature-requests)

---

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions. We're all learning!

---

## Getting Started

### 1. Fork and Clone

```bash
# Fork on GitHub: https://github.com/soumyamohan2006/Reservation
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Reservation.git
cd Reservation

# Add upstream remote
git remote add upstream https://github.com/soumyamohan2006/Reservation.git
```

### 2. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Install Dependencies

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 4. Setup Environment

```bash
# backend/.env
PORT=4000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# frontend/.env (optional - uses defaults)
VITE_API_URL=http://localhost:4000/api
```

### 5. Start Development

**Terminal 1:**
```bash
cd backend && npm run dev
```

**Terminal 2:**
```bash
cd frontend && npm run dev
```

---

## Development Workflow

### Before Coding

1. Check [GitHub Issues](https://github.com/AAYUSH9988/Reservation/issues) for open issues
2. Create an issue for your feature/bug (discuss before major changes)
3. Comment on the issue to claim it

### Writing Code

```bash
# Make your changes
# Keep commits small and focused
# Test frequently
git add .
git commit -m "feat: add password reset email validation"
```

### Before Pushing

```bash
# Fetch latest upstream changes
git fetch upstream

# Rebase if needed
git rebase upstream/main

# Run tests/builds
cd frontend && npm run build
cd ../backend && node scripts/seedSampleHalls.js
```

### Push and Create PR

```bash
git push origin feature/your-feature-name
# Go to GitHub and create Pull Request
```

---

## Coding Standards

### Frontend (React)

```javascript
// ✅ DO

// Arrow functions for components
const MyComponent = () => {
  return <div>Content</div>
}
export default MyComponent

// Use hooks for state
const [data, setData] = useState([])

// Destructure props
const Button = ({ onClick, label, disabled = false }) => (
  <button onClick={onClick} disabled={disabled}>{label}</button>
)

// Use meaningful names
const getUserBookings = async () => {}
const [isLoading, setIsLoading] = useState(false)

// Use async/await instead of .then()
const data = await api.get('/halls')

// Keep components focused
// If >150 lines, split into smaller components
```

```javascript
// ❌ DON'T

// Class components (use functional components)
class MyComponent extends React.Component {}

// Generic variable names
const data = fetchStuff()
const x = 10

// Nested ternaries
{condition1 ? condition2 ? x : y : z}

// Inline functions in JSX
<button onClick={() => { complex logic }}>Click</button>
```

### Backend (Node.js)

```javascript
// ✅ DO

// Use async/await
const booking = await Booking.findById(id)

// Proper error handling
try {
  // operation
} catch (error) {
  logger.error({ err: error }, 'Operation failed')
  throw new Error('User-friendly message')
}

// Validate input
const { error, value } = bookingSchema.validate(req.body)

// Use meaningful variable names
const isSlotAvailable = true
const formatDate = (date) => date.toISOString().split('T')[0]

// Separate concerns
// Keep routes simple, logic in controllers
```

```javascript
// ❌ DON'T

// Callback hell
function getData(callback) {
  function getMore(callback2) {
    // nested callbacks
  }
}

// Swallowing errors silently
try {
  // operation
} catch (e) {
  // do nothing
}

// Global variables
let globalData = []

// console.log in production
console.log('Debug info')

// Hardcoded values
const email = 'admin@example.com'
```

### File Organization

```
frontend/src/
├── pages/
│   ├── HomePage.jsx         # One feature per file
│   ├── LoginPage.jsx
│   └── AdminPage.jsx
├── components/
│   ├── Button.jsx           # Reusable components
│   ├── Dialog.jsx
│   └── Navbar.jsx
├── hooks/
│   └── useBackendWakeup.js  # Custom hooks
├── services/
│   └── api.js               # Centralized API
└── config.js                # Configuration

backend/
├── controllers/
│   ├── bookingController.js # Business logic
│   ├── authController.js
│   └── hallController.js
├── routes/
│   ├── bookings.js          # Route definitions
│   ├── auth.js
│   └── halls.js
├── models/
│   └── *.js                 # Schemas only
├── middleware/
│   └── *.js                 # Shared middleware
├── utils/
│   ├── logger.js
│   └── mailer.js
└── index.js                 # App entry
```

### Comments & Documentation

```javascript
// ✅ DO

/**
 * Create a new booking for a hall
 * @param {Object} req - Express request
 * @param {string} req.body.hallId - Hall ID
 * @param {string} req.body.slotId - Slot ID
 * @returns {Object} Success response with booking data
 * @throws {Error} If slot is already booked
 */
const createBooking = async (req, res) => {
  // Implementation
}

// ❌ DON'T

// This function creates a booking
const createBooking = (req, res) => {
  // Implementation
}

// TODO comments should have context
// TODO: Implement rate limiting - Issue #45
```

---

## Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style (formatting, etc.)
- `refactor:` Code refactoring
- `perf:` Performance improvement
- `test:` Test addition/update
- `chore:` Build, dependencies, etc.

### Examples

```
feat(auth): add password reset email verification
fix(booking): prevent overbooking with slot validation
docs: update API documentation with new endpoints
refactor(controllers): extract booking logic into service
```

---

## Pull Request Process

### Before Creating PR

- [ ] Code follows coding standards
- [ ] No console.log/debug statements remain
- [ ] Frontend builds without errors: `npm run build`
- [ ] Changes are tested manually
- [ ] Commit messages are descriptive
- [ ] No unrelated changes mixed in

### PR Title & Description

**Title:**
```
feat: Add booking cancellation with email notification
```

**Description:**
```markdown
## Description
Adds ability for users to cancel bookings with email notifications sent to custodians.

## Changes
- Add PUT /api/bookings/:id endpoint
- Add cancellation confirmation dialog
- Add email template for cancellation
- Prevent cancellation of already cancelled bookings

## Related Issue
Closes #42

## Testing
1. Create a booking
2. Navigate to My Bookings
3. Click Cancel on a pending booking
4. Confirm cancellation
5. Check email for notification

## Screenshots
[If applicable]
```

### PR Review Checklist

Reviewers will check:
- Code quality and standards
- No breaking changes
- Tests included
- Documentation updated
- Security considerations
- Performance impact

### Iterating on Feedback

```bash
# Make requested changes
git add .
git commit -m "refactor: address PR feedback"

# Push updates
git push origin feature/your-feature-name
# No need to create new PR - it updates automatically
```

---

## Bug Reports

### Issue Template

```markdown
## Description
Clear description of the bug.

## Steps to Reproduce
1. Navigate to...
2. Click on...
3. See error...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
[If applicable]

## Environment
- OS: macOS/Windows/Linux
- Node version: 18.x
- Browser: Chrome 123
```

### Example

```markdown
## Description
Password reset email contains broken link

## Steps to Reproduce
1. Click "Forgot Password" on login page
2. Enter email
3. Check email for reset link
4. Click link - get 404 error

## Expected Behavior
Should navigate to password reset page

## Actual Behavior
Shows 404 page

## Root Cause
Frontend URL in email template is hardcoded to localhost
```

---

## Feature Requests

### Feature Template

```markdown
## Description
Clear description of desired feature.

## Use Case
Why is this needed?

## Proposed Solution
How should it work?

## Alternatives Considered
Other approaches?

## Additional Context
Mockups, examples, references?
```

### Example

```markdown
## Description
Add dark mode theme toggle

## Use Case
Users want to use the app in low-light environments

## Proposed Solution
- Add theme toggle in navbar
- Use TailwindCSS dark mode
- Store preference in localStorage
- System theme detection as default

## Alternatives Considered
- Only system theme preference
- Only light mode

## Additional Context
Issue #38 mentioned this - several users requested it
```

---

## Common Development Tasks

### Adding a New Feature

1. **Create endpoint** in `backend/routes/`
2. **Add controller** in `backend/controllers/`
3. **Create API call** in `frontend/src/services/api.js`
4. **Build UI** in `frontend/src/pages/` or `components/`
5. **Test** with sample data
6. **Document** in README and API docs

### Fixing a Bug

1. **Reproduce** the issue
2. **Write test** case (optional but good practice)
3. **Fix** in controller/component
4. **Test** thoroughly
5. **Update** docs if needed

### Updating Documentation

1. Keep `README.md` as main overview
2. Update `API_DOCUMENTATION.md` for endpoint changes
3. Update `TECHNICAL_DOCUMENTATION.md` for architecture changes
4. Add code comments for complex logic

---

## Questions?

- Comment on GitHub Issues
- Create a Discussion in GitHub Discussions
- Tag maintainers in PRs for urgent questions

---

**Thank you for contributing! 🎉**
