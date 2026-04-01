// Use environment variable if available, otherwise use production backend URL
const apiUrl = import.meta.env.VITE_API_URL

// For development
if (import.meta.env.DEV && !apiUrl) {
  console.log('Development mode: Using localhost backend')
}

// For production - hardcoded backend URL
export const API_URL = apiUrl || 'https://reservation-ce32.onrender.com'

console.log('API_URL:', API_URL)
