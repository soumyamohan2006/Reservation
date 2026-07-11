export const parseRequestedTime = (message = '') => {
  if (!message) return ''

  const segments = message
    .split('|')
    .map((segment) => segment.trim())
    .filter(Boolean)

  const timeSegment = segments.find((segment) => /^time needed:/i.test(segment))
  if (timeSegment) return timeSegment.replace(/^time needed:/i, '').trim()

  const fallbackMatch = message.match(/time needed:\s*(.+)$/i)
  return fallbackMatch ? fallbackMatch[1].trim() : ''
}

export const parseTimeRange = (message = '') => {
  const timeText = parseRequestedTime(message)
  if (!timeText) return null

  const match = timeText.match(/(\d{1,2}(?::\d{2})?(?:\s?[AP]M)?)(?:\s*[–-]\s*|\s*-\s*)(\d{1,2}(?::\d{2})?(?:\s?[AP]M)?)/i)
  if (!match) return null

  return { start: match[1].trim(), end: match[2].trim() }
}

export const toMinutes = (t) => {
  if (!t) return 0

  const normalized = t.trim().replace(/\s+/g, '')
  if (/^\d{1,2}:\d{2}$/.test(normalized)) {
    const [h, m] = normalized.split(':').map(Number)
    return h * 60 + m
  }

  const simpleMatch = normalized.match(/^(\d{1,2})(?::(\d{2}))?$/)
  if (simpleMatch) {
    const h = parseInt(simpleMatch[1], 10)
    const m = parseInt(simpleMatch[2] || '0', 10)
    return h * 60 + m
  }

  const meridiemMatch = normalized.match(/^(\d{1,2})(?::(\d{2}))?(AM|PM)$/i)
  if (!meridiemMatch) return 0

  let h = parseInt(meridiemMatch[1], 10)
  const m = parseInt(meridiemMatch[2] || '0', 10)
  const p = meridiemMatch[3].toUpperCase()

  if (p === 'PM' && h !== 12) h += 12
  if (p === 'AM' && h === 12) h = 0

  return h * 60 + m
}

export const toLabel = (min) => {
  let h = Math.floor(min / 60)
  const m = min % 60
  const p = h >= 12 ? 'PM' : 'AM'

  if (h > 12) h -= 12
  if (h === 0) h = 12

  return m === 0 ? `${h}${p}` : `${h}:${String(m).padStart(2, '0')}${p}`
}
