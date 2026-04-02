import { API_URL } from '../config'

// Helper function to standardise fetch calls
const fetcher = async (url, options = {}) => {
  const token = localStorage.getItem('token')
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  })

  // We await json parsing unless it's a 204 No Content
  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data.message || 'An error occurred with the request.')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export const api = {
  // --- Auth & Users ---
  login: (credentials) => fetcher('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => fetcher('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  adminLogin: (credentials) => fetcher('/api/auth/admin-login', { method: 'POST', body: JSON.stringify(credentials) }),
  custodianLogin: (credentials) => fetcher('/api/auth/custodian-login', { method: 'POST', body: JSON.stringify(credentials) }),
  setPassword: (passwordData) => fetcher('/api/auth/set-password', { method: 'POST', body: JSON.stringify(passwordData) }),
  
  getUsers: () => fetcher('/api/users'),
  deleteUser: (id) => fetcher(`/api/users/${id}`, { method: 'DELETE' }),
  changeUserRole: (id, role) => fetcher(`/api/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  createCustodian: (data) => fetcher('/api/users/custodian', { method: 'POST', body: JSON.stringify(data) }),

  // --- Halls ---
  getHalls: () => fetcher('/api/halls'),
  getCustodianHalls: () => fetcher('/api/halls/custodian'),
  createHall: (data) => fetcher('/api/halls', { method: 'POST', body: JSON.stringify(data) }),
  updateHall: (id, data) => fetcher(`/api/halls/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteHall: (id) => fetcher(`/api/halls/${id}`, { method: 'DELETE' }),

  // --- Slots ---
  getAvailableSlots: (hallId, date) => fetcher(`/api/slots?hallId=${hallId}&date=${date}`),
  getAllSlots: () => fetcher('/api/slots'),
  getCustodianSlots: () => fetcher('/api/slots/custodian'),
  createSlot: (slotData) => fetcher('/api/slots', { method: 'POST', body: JSON.stringify(slotData) }),
  deleteSlot: (id) => fetcher(`/api/slots/${id}`, { method: 'DELETE' }),

  // --- Bookings ---
  getMyBookings: () => fetcher('/api/bookings/my-bookings'),
  createBooking: (bookingData) => fetcher('/api/bookings', { method: 'POST', body: JSON.stringify(bookingData) }),
  getGlobalBookings: (hallId) => fetcher(`/api/bookings${hallId ? `?hallId=${hallId}` : ''}`),
  getCustodianBookings: () => fetcher('/api/bookings/custodian-bookings'),
  updateBookingStatus: (id, status) => fetcher(`/api/bookings/${id}`, { method: 'PUT', body: JSON.stringify({ status }) })
}

export default api;
