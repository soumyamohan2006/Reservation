import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { API_URL } from '../config'

const WAKEUP_KEY = 'backend_last_healthy'
const HEALTHY_GRACE_MS = 5 * 60 * 1000 // 5 minutes
/**
 * Pings the backend health endpoint using native fetch (NO Axios).
 * If the backend doesn't respond quickly (>2s), we show a toast and
 * return `isWaking = true` so the UI can show placeholders.
 */
export function useBackendWakeup() {
  const [isWaking, setIsWaking] = useState(() => {
    const last = Number(localStorage.getItem(WAKEUP_KEY) || 0)
    return Date.now() - last > HEALTHY_GRACE_MS
  })
  const toastRef = useRef(null)

  useEffect(() => {
    const last = Number(localStorage.getItem(WAKEUP_KEY) || 0)
    if (Date.now() - last < HEALTHY_GRACE_MS) {
      setIsWaking(false)
      return
    }

    let resolved = false
    let slowTimer = null

    const wakeup = async () => {
      // Show a slow-server toast after 1.5 s if still not resolved
      slowTimer = setTimeout(() => {
        if (!resolved) {
          toastRef.current = toast.loading('Waking up server… This may take 30-60 seconds on first load.', {
            duration: Infinity,
            icon: '🌑',
            style: {
              background: '#1e1e20',
              color: '#e2e8f0',
              border: '1px solid rgba(173,198,255,0.2)',
              fontFamily: 'Inter, sans-serif',
            },
          })
        }
      }, 1500)

      try {
        const start = Date.now()
        const response = await fetch(`${API_URL}/api/halls`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(90_000), // 90s max timeout for cold start
        })
        if (!response.ok) {
          throw new Error(`Health check failed with ${response.status}`)
        }
        resolved = true
        clearTimeout(slowTimer)

        localStorage.setItem(WAKEUP_KEY, String(Date.now()))
        setIsWaking(false)

        if (toastRef.current) {
          toast.dismiss(toastRef.current)
          toast.success('Server is awake! Loading your spaces…', {
            duration: 3000,
            icon: '✨',
            style: {
              background: '#1e1e20',
              color: '#e2e8f0',
              border: '1px solid rgba(134,239,172,0.3)',
              fontFamily: 'Inter, sans-serif',
            },
          })
          toastRef.current = null
        }
      } catch {
        resolved = true
        clearTimeout(slowTimer)
        if (toastRef.current) {
          toast.dismiss(toastRef.current)
          toast.error('Server is not reachable. Please try again later.', {
            duration: 8000,
            style: {
              background: '#1e1e20',
              color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.3)',
              fontFamily: 'Inter, sans-serif',
            },
          })
          toastRef.current = null
        }
      }
    }

    wakeup()

    return () => {
      clearTimeout(slowTimer)
    }
  }, [])

  return { isWaking }
}

/** Mock placeholder halls shown while the Render backend is sleeping */
export const MOCK_HALLS = [
  {
    _id: 'mock-1',
    id: 'mock-1',
    name: 'Seminar Hall A',
    capacity: 120,
    description: 'Ideal for departmental seminars and academic lectures.',
    imageUrl: null,
    custodianId: null,
  },
  {
    _id: 'mock-2',
    id: 'mock-2',
    name: 'Conference Center',
    capacity: 60,
    description: 'Premium conference center with AV equipment and breakout rooms.',
    imageUrl: null,
    custodianId: null,
  },
  {
    _id: 'mock-3',
    id: 'mock-3',
    name: 'Auditorium',
    capacity: 500,
    description: 'Grand auditorium with stadium seating for major events.',
    imageUrl: null,
    custodianId: null,
  },
]
