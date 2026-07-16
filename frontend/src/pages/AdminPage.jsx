import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import CalendarView from '../components/CalendarView'

const TIME_POINTS = ['6AM','7AM','8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM','6PM','7PM','8PM','9PM','10PM']

function toMinutes(t) {
  const m = t.match(/^(\d+)(AM|PM)$/i)
  if (!m) return 0
  let h = parseInt(m[1])
  const p = m[2].toUpperCase()
  if (p === 'PM' && h !== 12) h += 12
  if (p === 'AM' && h === 12) h = 0
  return h * 60
}

const card = { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }
const badge = (role) => ({
  padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
  background: role === 'admin' ? '#dbeafe' : role === 'custodian' ? '#ede9fe' : role === 'faculty' ? '#dcfce7' : '#f1f5f9',
  color: role === 'admin' ? '#1e40af' : role === 'custodian' ? '#6d28d9' : role === 'faculty' ? '#15803d' : '#475569',
})
const statusColor = (s) => s === 'Approved' ? '#15803d' : s === 'Rejected' ? '#b91c1c' : '#b45309'

const TABS = ['🏛️ Facilities', '📋 Bookings', '📅 Calendar', '👥 Users', '👤 Custodians', '🕐 Slots']

export default function AdminPage({ token }) {
  const [tab, setTab] = useState('🏛️ Facilities')
  const [halls, setHalls] = useState([])
  const [users, setUsers] = useState([])
  const [bookings, setBookings] = useState([])
  const [slots, setSlots] = useState([])
  const [slotPage, setSlotPage] = useState(1)
  const [slotTotalPages, setSlotTotalPages] = useState(1)
  const [slotTotal, setSlotTotal] = useState(0)
  const [slotLimit, setSlotLimit] = useState(10)
  const [userPage, setUserPage] = useState(1)
  const [userTotalPages, setUserTotalPages] = useState(1)
  const [userTotal, setUserTotal] = useState(0)
  const [userLimit, setUserLimit] = useState(10)
  const [bookingPage, setBookingPage] = useState(1)
  const [bookingTotalPages, setBookingTotalPages] = useState(1)
  const [bookingTotal, setBookingTotal] = useState(0)
  const [bookingLimit, setBookingLimit] = useState(10)
  const [allCustodians, setAllCustodians] = useState([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  // Facility form
  const [hallName, setHallName] = useState('')
  const [hallCapacity, setHallCapacity] = useState('')
  const [hallCustodian, setHallCustodian] = useState('')
  const [editHall, setEditHall] = useState(null)

  // Slot form
  const [slotHallId, setSlotHallId] = useState('')
  const [slotDate, setSlotDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkStartDate, setBulkStartDate] = useState('')
  const [bulkEndDate, setBulkEndDate] = useState('')
  const [generatingSlots, setGeneratingSlots] = useState(false)
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [deleteHallId, setDeleteHallId] = useState('')
  const [deleteTimeSlot, setDeleteTimeSlot] = useState('')
  const [deleteStartDate, setDeleteStartDate] = useState('')
  const [deleteEndDate, setDeleteEndDate] = useState('')

  // Custodian form
  const [custodianName, setCustodianName] = useState('')
  const [custodianEmail, setCustodianEmail] = useState('')
  const [tempPassword, setTempPassword] = useState('')

  const tk = () => token || localStorage.getItem('token')
  const api = (path, opts = {}) => {
    const { headers, ...rest } = opts
    return fetch(`${API_URL}/api${path}`, {
      ...rest,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk()}`, ...headers },
    })
  }

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchHalls(), fetchUsers(1, userLimit), fetchBookings(1, bookingLimit), fetchSlots(1, slotLimit), fetchAllCustodians()])
    setLoading(false)
  }

  const fetchHalls    = async () => { try { const r = await api('/halls'); const d = await r.json(); if (r.ok) setHalls(d) } catch {} }
  const fetchAllCustodians = async () => { try { const r = await api('/users?limit=500'); const d = await r.json(); if (r.ok) setAllCustodians((d.users || d).filter(u => u.role === 'custodian')) } catch {} }
  const fetchUsers = async (page, limit) => {
    const p = page || userPage
    const l = limit || userLimit
    try {
      const r = await api(`/users?page=${p}&limit=${l}`)
      const d = await r.json()
      if (r.ok) {
        setUsers(d.users)
        setUserTotal(d.total)
        setUserTotalPages(d.totalPages)
        setUserPage(d.page)
      }
    } catch {}
  }
  const fetchBookings = async (page, limit) => {
    const p = page || bookingPage
    const l = limit || bookingLimit
    try {
      const r = await api(`/bookings?page=${p}&limit=${l}`)
      const d = await r.json()
      if (r.ok) {
        setBookings(d.bookings)
        setBookingTotal(d.total)
        setBookingTotalPages(d.totalPages)
        setBookingPage(d.page)
      }
    } catch {}
  }
  const fetchSlots = async (page, limit) => {
    const p = page || slotPage
    const l = limit || slotLimit
    try {
      const r = await api(`/slots?page=${p}&limit=${l}`)
      const d = await r.json()
      if (r.ok) {
        setSlots(d.slots)
        setSlotTotal(d.total)
        setSlotTotalPages(d.totalPages)
        setSlotPage(d.page)
      }
    } catch {}
  }

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  // --- FACILITIES ---
  const saveHall = async (e) => {
    e.preventDefault()
    if (!hallName || !hallCapacity) { flash('❌ Name and capacity required.'); return }
    const body = JSON.stringify({ name: hallName, capacity: Number(hallCapacity), custodianId: hallCustodian || null })
    const r = editHall
      ? await api(`/halls/${editHall._id}`, { method: 'PATCH', body })
      : await api('/halls', { method: 'POST', body })
    const d = await r.json()
    if (r.ok) { flash(`✅ Hall ${editHall ? 'updated' : 'created'}.`); setHallName(''); setHallCapacity(''); setHallCustodian(''); setEditHall(null); fetchHalls() }
    else flash(`❌ ${d.message}`)
  }

  const startEditHall = (h) => { setEditHall(h); setHallName(h.name); setHallCapacity(h.capacity); setHallCustodian(h.custodianId?._id || ''); setTab('🏛️ Facilities') }

  const deleteHall = async (id) => {
    if (!confirm('Delete this hall?')) return
    await api(`/halls/${id}`, { method: 'DELETE' }); flash('✅ Hall deleted.'); fetchHalls()
  }

  // --- USERS ---
  const changeRole = async (id, role) => {
    const r = await api(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) })
    if (r.ok) { flash('✅ Role updated.'); fetchUsers() }
  }

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return
    await api(`/users/${id}`, { method: 'DELETE' })
    flash('✅ User deleted.')
    const newPage = users.length === 1 && userPage > 1 ? userPage - 1 : userPage
    if (newPage !== userPage) setUserPage(newPage)
    fetchUsers(newPage)
    fetchAllCustodians()
  }

  const createCustodian = async (e) => {
    e.preventDefault()
    if (!custodianName || !custodianEmail) { flash('❌ Name and email required.'); return }
    const r = await api('/users/custodian', { method: 'POST', body: JSON.stringify({ name: custodianName, email: custodianEmail }) })
    const d = await r.json()
    if (r.ok) {
      flash(`✅ Custodian created.`)
      setTempPassword(d.tempPassword)
      setCustodianName('')
      setCustodianEmail('')
      fetchUsers()
      fetchAllCustodians()
    } else flash(`❌ ${d.message}`)
  }

  // --- BOOKINGS ---
  const updateBooking = async (id, status) => {
    const r = await api(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify({ status }) })
    if (r.ok) { flash(`✅ Booking ${status}.`); fetchBookings(); fetchSlots() }
  }

  // --- SLOTS ---
  const addSlot = async (e) => {
    e.preventDefault()
    
    if (bulkMode) {
      if (!slotHallId || !bulkStartDate || !bulkEndDate) { flash('❌ Hall, start date and end date are required.'); return }
      const timeSlot = (startTime && endTime) ? `${startTime}-${endTime}` : undefined
      const body = { hallId: slotHallId, startDate: bulkStartDate, endDate: bulkEndDate }
      if (timeSlot) body.timeSlot = timeSlot
      setGeneratingSlots(true)
      const r = await api('/slots', { method: 'POST', body: JSON.stringify(body) })
      const d = await r.json()
      setGeneratingSlots(false)
      if (r.ok) { 
        flash(`✅ ${d.message || 'Slots generated.'}`)
        setBulkStartDate('')
        setBulkEndDate('')
        setStartTime('')
        setEndTime('')
        fetchSlots()
      } else flash(`❌ ${d.message}`)
    } else {
      if (!slotHallId || !slotDate) { flash('❌ Hall and date are required.'); return }
      const finalStartTime = startTime || '8AM'
      const finalEndTime = endTime || '10PM'
      const r = await api('/slots', { method: 'POST', body: JSON.stringify({ hallId: slotHallId, date: slotDate, timeSlot: `${finalStartTime}-${finalEndTime}` }) })
      const d = await r.json()
      if (r.ok) { flash('✅ Slot added.'); setSlotDate(''); setStartTime(''); setEndTime(''); fetchSlots() }
      else flash(`❌ ${d.message}`)
    }
  }

  const deleteSlot = async (id) => {
    await api(`/slots/${id}`, { method: 'DELETE' })
    const newPage = slots.length === 1 && slotPage > 1 ? slotPage - 1 : slotPage
    if (newPage !== slotPage) setSlotPage(newPage)
    fetchSlots(newPage)
  }

  const bulkDeleteSlots = async (e) => {
    e.preventDefault()
    if (!deleteHallId && !deleteTimeSlot && !deleteStartDate && !deleteEndDate) {
      flash('❌ Please select at least one filter.')
      return
    }
    
    const body = {}
    if (deleteHallId) body.hallId = deleteHallId
    if (deleteTimeSlot) body.timeSlot = deleteTimeSlot
    if (deleteStartDate) body.startDate = deleteStartDate
    if (deleteEndDate) body.endDate = deleteEndDate
    
    const filterDesc = []
    if (deleteHallId) filterDesc.push(`Hall: ${halls.find(h => h._id === deleteHallId)?.name}`)
    if (deleteTimeSlot) filterDesc.push(`Time: ${deleteTimeSlot}`)
    if (deleteStartDate && deleteEndDate) filterDesc.push(`Dates: ${deleteStartDate} to ${deleteEndDate}`)
    else if (deleteStartDate) filterDesc.push(`From: ${deleteStartDate}`)
    else if (deleteEndDate) filterDesc.push(`Until: ${deleteEndDate}`)
    
    if (!confirm(`Are you sure you want to delete all slots matching:\n${filterDesc.join('\n')}\n\nThis cannot be undone.`)) return
    
    const r = await api('/slots/bulk-delete', { method: 'POST', body: JSON.stringify(body) })
    const d = await r.json()
    if (r.ok) {
      flash(`✅ ${d.message}`)
      setDeleteHallId('')
      setDeleteTimeSlot('')
      setDeleteStartDate('')
      setDeleteEndDate('')
      setShowBulkDelete(false)
      setSlotPage(1)
      fetchSlots(1)
    } else flash(`❌ ${d.message}`)
  }

  const custodians = allCustodians
  const endTimeOptions = TIME_POINTS.filter(t => !startTime || toMinutes(t) > toMinutes(startTime))

  const inp = { padding: '0.65rem 0.9rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0.5rem', color: '#0f172a', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }
  const lbl = { color: '#475569', fontSize: '0.8rem', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: '0.35rem' }
  const editBtn = { padding: '0.3rem 0.7rem', background: '#dbeafe', border: 'none', borderRadius: '0.375rem', color: '#1e40af', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }
  const deleteBtn = { padding: '0.3rem 0.7rem', background: 'transparent', border: '1px solid #fca5a5', borderRadius: '0.375rem', color: '#b91c1c', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }

  return (
    <main style={{ minHeight: '100vh', background: '#f1f5f9', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.2rem' }}>🛡️</div>
          <div>
            <h1 style={{ color: '#0f172a', margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Admin Panel</h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem' }}>Manage facilities, users, bookings and slots</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
            {[
              { label: 'Halls', val: halls.length, color: '#2563eb' },
              { label: 'Users', val: userTotal, color: '#3b82f6' },
              { label: 'Bookings', val: bookingTotal, color: '#b45309' },
            ].map(s => (
              <div key={s.label} style={{ ...card, padding: '0.6rem 1rem', marginBottom: 0, textAlign: 'center', minWidth: '70px' }}>
                <div style={{ color: s.color, fontSize: '1.3rem', fontWeight: 800 }}>{s.val}</div>
                <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: 0 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => { setTab(t); setMsg(''); setEditHall(null) }}
              style={{ padding: '0.55rem 1.1rem', background: tab === t ? '#2563eb' : 'transparent', color: tab === t ? '#fff' : '#64748b', border: 'none', borderRadius: '0.5rem 0.5rem 0 0', cursor: 'pointer', fontWeight: tab === t ? 700 : 400, fontSize: '0.875rem' }}>
              {t}
            </button>
          ))}
        </div>
        {msg && <div style={{ padding: '0.7rem 1rem', background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', border: `1px solid ${msg.startsWith('✅') ? '#86efac' : '#fca5a5'}`, borderRadius: '0.5rem', color: msg.startsWith('✅') ? '#15803d' : '#b91c1c', marginBottom: '1rem', fontSize: '0.875rem' }}>{msg}</div>}

        {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: '3rem' }}>Loading...</div> : <>

          {/* ── FACILITIES TAB ── */}
          {tab === '🏛️ Facilities' && (
            <>
              <div style={card}>
                <h2 style={{ color: '#0f172a', marginTop: 0, fontSize: '1rem' }}>{editHall ? '✏️ Edit Facility' : '➕ Create Facility'}</h2>
                <form onSubmit={saveHall} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
                  <label style={lbl}>Hall Name <input style={inp} value={hallName} onChange={e => setHallName(e.target.value)} placeholder="e.g. Auditorium" /></label>
                  <label style={lbl}>Capacity <input style={inp} type="number" value={hallCapacity} onChange={e => setHallCapacity(e.target.value)} placeholder="e.g. 500" /></label>
                  <label style={lbl}>
                    Assign Custodian
                    <select style={inp} value={hallCustodian} onChange={e => setHallCustodian(e.target.value)}>
                      <option value="">— None —</option>
                      {custodians.map(c => <option key={c._id} value={c._id}>{c.name} ({c.email})</option>)}
                    </select>
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" style={{ padding: '0.65rem 1.2rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {editHall ? 'Update' : 'Create'}
                    </button>
                    {editHall && <button type="button" onClick={() => { setEditHall(null); setHallName(''); setHallCapacity(''); setHallCustodian('') }} style={{ padding: '0.65rem 0.9rem', background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>}
                  </div>
                </form>
              </div>
              <div style={card}>
                <h2 style={{ color: '#0f172a', marginTop: 0, fontSize: '1rem' }}>All Facilities</h2>
                {halls.length === 0 ? <p style={{ color: '#64748b' }}>No halls yet.</p> : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        {['Hall', 'Capacity', 'Custodian', 'Actions'].map(h => <th key={h} style={{ padding: '0.7rem', textAlign: 'left', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {halls.map(h => (
                          <tr key={h._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem', color: '#0f172a', fontWeight: 600 }}>{h.name}</td>
                            <td style={{ padding: '0.75rem', color: '#475569' }}>{h.capacity}</td>
                            <td style={{ padding: '0.75rem', color: h.custodianId ? '#2563eb' : '#94a3b8', fontSize: '0.85rem' }}>
                              {h.custodianId ? `${h.custodianId.name} (${h.custodianId.email})` : '— Unassigned —'}
                            </td>
                            <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => startEditHall(h)} style={editBtn} onMouseEnter={e => e.target.style.background = '#bfdbfe'} onMouseLeave={e => e.target.style.background = '#dbeafe'}>Edit</button>
                              <button onClick={() => deleteHall(h._id)} style={deleteBtn} onMouseEnter={e => e.target.style.background = '#fee2e2'} onMouseLeave={e => e.target.style.background = 'transparent'}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── BOOKINGS TAB ── */}
          {tab === '📋 Bookings' && (
            <div style={card}>
              <h2 style={{ color: '#0f172a', marginTop: 0, fontSize: '1rem' }}>All Bookings</h2>
              {bookingTotal === 0 ? <p style={{ color: '#64748b' }}>No bookings yet.</p> : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        {['User', 'Hall', 'Date', 'Time Slot', 'Message', 'Status', 'Action'].map(h => <th key={h} style={{ padding: '0.7rem', textAlign: 'left', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {bookings.map(b => (
                          <tr key={b._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 600 }}>{b.userId?.name}</div>
                              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{b.userId?.email}</div>
                            </td>
                            <td style={{ padding: '0.75rem', color: '#0f172a', fontSize: '0.875rem' }}>{b.hallId?.name}</td>
                            <td style={{ padding: '0.75rem', color: '#0f172a', fontSize: '0.875rem' }}>{b.slotId?.date}</td>
                            <td style={{ padding: '0.75rem', color: '#2563eb', fontWeight: 600, fontSize: '0.875rem' }}>{b.slotId?.timeSlot}</td>
                            <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.8rem', maxWidth: '140px' }}>{b.message || '—'}</td>
                            <td style={{ padding: '0.75rem', fontWeight: 700, color: statusColor(b.status), fontSize: '0.85rem' }}>{b.status}</td>
                            <td style={{ padding: '0.75rem' }}>
                              {b.status === 'Pending' && (
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button onClick={() => updateBooking(b._id, 'Approved')} style={{ padding: '0.3rem 0.6rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.375rem', color: '#15803d', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>✅</button>
                                  <button onClick={() => updateBooking(b._id, 'Rejected')} style={{ padding: '0.3rem 0.6rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.375rem', color: '#b91c1c', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>❌</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Rows:</span>
                      <select value={bookingLimit} onChange={e => { const l = Number(e.target.value); setBookingLimit(l); setBookingPage(1); fetchBookings(1, l) }}
                        style={{ padding: '0.3rem 0.5rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0.375rem', color: '#0f172a', fontSize: '0.8rem', cursor: 'pointer' }}>
                        {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                        Showing {Math.min((bookingPage - 1) * bookingLimit + 1, bookingTotal)}–{Math.min(bookingPage * bookingLimit, bookingTotal)} of {bookingTotal}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <button onClick={() => fetchBookings(1)} disabled={bookingPage <= 1}
                        style={{ padding: '0.35rem 0.6rem', background: bookingPage <= 1 ? '#f1f5f9' : '#fff', color: bookingPage <= 1 ? '#cbd5e1' : '#475569', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: bookingPage <= 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>«</button>
                      <button onClick={() => fetchBookings(bookingPage - 1)} disabled={bookingPage <= 1}
                        style={{ padding: '0.35rem 0.6rem', background: bookingPage <= 1 ? '#f1f5f9' : '#fff', color: bookingPage <= 1 ? '#cbd5e1' : '#475569', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: bookingPage <= 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>‹</button>
                      {(() => {
                        const pages = []
                        const start = Math.max(1, bookingPage - 2)
                        const end = Math.min(bookingTotalPages, bookingPage + 2)
                        if (start > 1) pages.push(<button key="e1" onClick={() => fetchBookings(1)}
                          style={{ padding: '0.35rem 0.6rem', background: '#fff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>1</button>)
                        if (start > 2) pages.push(<span key="d1" style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '0 0.2rem' }}>…</span>)
                        for (let i = start; i <= end; i++) {
                          pages.push(
                            <button key={i} onClick={() => fetchBookings(i)}
                              style={{ padding: '0.35rem 0.6rem', background: i === bookingPage ? '#2563eb' : '#fff', color: i === bookingPage ? '#fff' : '#475569', border: i === bookingPage ? '1px solid #2563eb' : '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>{i}</button>
                          )
                        }
                        if (end < bookingTotalPages - 1) pages.push(<span key="d2" style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '0 0.2rem' }}>…</span>)
                        if (end < bookingTotalPages) pages.push(<button key="en" onClick={() => fetchBookings(bookingTotalPages)}
                          style={{ padding: '0.35rem 0.6rem', background: '#fff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>{bookingTotalPages}</button>)
                        return pages
                      })()}
                      <button onClick={() => fetchBookings(bookingPage + 1)} disabled={bookingPage >= bookingTotalPages}
                        style={{ padding: '0.35rem 0.6rem', background: bookingPage >= bookingTotalPages ? '#f1f5f9' : '#fff', color: bookingPage >= bookingTotalPages ? '#cbd5e1' : '#475569', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: bookingPage >= bookingTotalPages ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>›</button>
                      <button onClick={() => fetchBookings(bookingTotalPages)} disabled={bookingPage >= bookingTotalPages}
                        style={{ padding: '0.35rem 0.6rem', background: bookingPage >= bookingTotalPages ? '#f1f5f9' : '#fff', color: bookingPage >= bookingTotalPages ? '#cbd5e1' : '#475569', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: bookingPage >= bookingTotalPages ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>»</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── CALENDAR TAB ── */}
          {tab === '📅 Calendar' && (
            <div style={card}>
              <h2 style={{ color: '#0f172a', marginTop: 0, fontSize: '1rem' }}>📅 Booking Calendar</h2>
              <CalendarView bookings={bookings} slots={slots} halls={halls} />
            </div>
          )}

          {/* ── USERS TAB ── */}
          {tab === '👥 Users' && (
            <div style={card}>
              <h2 style={{ color: '#0f172a', marginTop: 0, fontSize: '1rem' }}>Manage Users</h2>
              {userTotal === 0 ? <p style={{ color: '#64748b' }}>No users found.</p> : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        {['Name', 'Email', 'Role', 'Joined', 'Actions'].map(h => <th key={h} style={{ padding: '0.7rem', textAlign: 'left', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem', color: '#0f172a', fontSize: '0.875rem', fontWeight: 600 }}>{u.name}</td>
                            <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.8rem' }}>{u.email}</td>
                            <td style={{ padding: '0.75rem' }}><span style={badge(u.role)}>{u.role}</span></td>
                            <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.8rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <select value={u.role} onChange={e => changeRole(u._id, e.target.value)}
                                  style={{ padding: '0.3rem 0.5rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0.375rem', color: '#0f172a', fontSize: '0.8rem', cursor: 'pointer' }}>
                                  <option value="student">student</option>
                                  <option value="faculty">faculty</option>
                                  <option value="admin">admin</option>
                                  <option value="custodian">custodian</option>
                                </select>
                                <button onClick={() => deleteUser(u._id)} style={deleteBtn} onMouseEnter={e => e.target.style.background = '#fee2e2'} onMouseLeave={e => e.target.style.background = 'transparent'}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Rows:</span>
                      <select value={userLimit} onChange={e => { const l = Number(e.target.value); setUserLimit(l); setUserPage(1); fetchUsers(1, l) }}
                        style={{ padding: '0.3rem 0.5rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0.375rem', color: '#0f172a', fontSize: '0.8rem', cursor: 'pointer' }}>
                        {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                        Showing {Math.min((userPage - 1) * userLimit + 1, userTotal)}–{Math.min(userPage * userLimit, userTotal)} of {userTotal}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <button onClick={() => fetchUsers(1)} disabled={userPage <= 1}
                        style={{ padding: '0.35rem 0.6rem', background: userPage <= 1 ? '#f1f5f9' : '#fff', color: userPage <= 1 ? '#cbd5e1' : '#475569', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: userPage <= 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>«</button>
                      <button onClick={() => fetchUsers(userPage - 1)} disabled={userPage <= 1}
                        style={{ padding: '0.35rem 0.6rem', background: userPage <= 1 ? '#f1f5f9' : '#fff', color: userPage <= 1 ? '#cbd5e1' : '#475569', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: userPage <= 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>‹</button>
                      {(() => {
                        const pages = []
                        const start = Math.max(1, userPage - 2)
                        const end = Math.min(userTotalPages, userPage + 2)
                        if (start > 1) pages.push(<button key="e1" onClick={() => fetchUsers(1)}
                          style={{ padding: '0.35rem 0.6rem', background: '#fff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>1</button>)
                        if (start > 2) pages.push(<span key="d1" style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '0 0.2rem' }}>…</span>)
                        for (let i = start; i <= end; i++) {
                          pages.push(
                            <button key={i} onClick={() => fetchUsers(i)}
                              style={{ padding: '0.35rem 0.6rem', background: i === userPage ? '#2563eb' : '#fff', color: i === userPage ? '#fff' : '#475569', border: i === userPage ? '1px solid #2563eb' : '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>{i}</button>
                          )
                        }
                        if (end < userTotalPages - 1) pages.push(<span key="d2" style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '0 0.2rem' }}>…</span>)
                        if (end < userTotalPages) pages.push(<button key="en" onClick={() => fetchUsers(userTotalPages)}
                          style={{ padding: '0.35rem 0.6rem', background: '#fff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>{userTotalPages}</button>)
                        return pages
                      })()}
                      <button onClick={() => fetchUsers(userPage + 1)} disabled={userPage >= userTotalPages}
                        style={{ padding: '0.35rem 0.6rem', background: userPage >= userTotalPages ? '#f1f5f9' : '#fff', color: userPage >= userTotalPages ? '#cbd5e1' : '#475569', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: userPage >= userTotalPages ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>›</button>
                      <button onClick={() => fetchUsers(userTotalPages)} disabled={userPage >= userTotalPages}
                        style={{ padding: '0.35rem 0.6rem', background: userPage >= userTotalPages ? '#f1f5f9' : '#fff', color: userPage >= userTotalPages ? '#cbd5e1' : '#475569', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: userPage >= userTotalPages ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>»</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── CUSTODIANS TAB ── */}
          {tab === '👤 Custodians' && (
            <>
              <div style={card}>
                <h2 style={{ color: '#0f172a', marginTop: 0, fontSize: '1rem' }}>➕ Create Custodian</h2>
                <form onSubmit={createCustodian} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
                  <label style={lbl}>Name <input style={inp} value={custodianName} onChange={e => setCustodianName(e.target.value)} placeholder="Full name" /></label>
                  <label style={lbl}>Email <input style={inp} type="email" value={custodianEmail} onChange={e => setCustodianEmail(e.target.value)} placeholder="email@example.com" /></label>
                  <button type="submit" style={{ padding: '0.65rem 1.2rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Create</button>
                </form>
                {tempPassword && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem', color: '#15803d', fontSize: '0.875rem' }}>
                    ✅ Custodian created. Temporary password: <strong>{tempPassword}</strong>
                  </div>
                )}
              </div>
              <div style={card}>
                <h2 style={{ color: '#0f172a', marginTop: 0, fontSize: '1rem' }}>All Custodians</h2>
                {custodians.length === 0 ? <p style={{ color: '#64748b' }}>No custodians found.</p> : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        {['Name', 'Email', 'Assigned Halls', 'Joined', 'Actions'].map(h => <th key={h} style={{ padding: '0.7rem', textAlign: 'left', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {custodians.map(u => (
                          <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem', color: '#0f172a', fontSize: '0.875rem', fontWeight: 600 }}>{u.name}</td>
                            <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.8rem' }}>{u.email}</td>
                            <td style={{ padding: '0.75rem', color: '#2563eb', fontSize: '0.8rem' }}>
                              {halls.filter(h => h.custodianId?._id === u._id).map(h => h.name).join(', ') || '— None —'}
                            </td>
                            <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.8rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <button onClick={() => deleteUser(u._id)} style={deleteBtn} onMouseEnter={e => e.target.style.background = '#fee2e2'} onMouseLeave={e => e.target.style.background = 'transparent'}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── SLOTS TAB ── */}
          {tab === '🕐 Slots' && (
            <>
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ color: '#0f172a', margin: 0, fontSize: '1rem' }}>➕ {bulkMode ? 'Generate Slots (Bulk)' : 'Add Single Slot'}</h2>
                  <button onClick={() => { setBulkMode(!bulkMode); setSlotDate(''); setBulkStartDate(''); setBulkEndDate(''); setStartTime(''); setEndTime('') }}
                    style={{ padding: '0.5rem 1rem', background: bulkMode ? '#ede9fe' : '#dbeafe', color: bulkMode ? '#6d28d9' : '#1e40af', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                    {bulkMode ? '📅 Switch to Single' : '📆 Switch to Bulk'}
                  </button>
                </div>
                {bulkMode ? (
                  <form onSubmit={addSlot} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                      <label style={lbl}>Hall
                        <select style={inp} value={slotHallId} onChange={e => setSlotHallId(e.target.value)} required>
                          <option value="" disabled>Select hall</option>
                          {halls.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                        </select>
                      </label>
                      <label style={lbl}>Start Date <input style={inp} type="date" value={bulkStartDate} onChange={e => setBulkStartDate(e.target.value)} required /></label>
                      <label style={lbl}>End Date <input style={inp} type="date" value={bulkEndDate} onChange={e => setBulkEndDate(e.target.value)} required /></label>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <label style={lbl}>Start Time (default: 8AM)
                        <select style={inp} value={startTime} onChange={e => { setStartTime(e.target.value); setEndTime('') }}>
                          <option value="">Default (8AM)</option>
                          {TIME_POINTS.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </label>
                      <label style={lbl}>End Time (default: 10PM)
                        <select style={inp} value={endTime} onChange={e => setEndTime(e.target.value)}>
                          <option value="">Default (10PM)</option>
                          {endTimeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </label>
                    </div>
                    <div style={{ padding: '0.75rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', color: '#1e40af', fontSize: '0.85rem' }}>
                      💡 <b>Bulk Mode:</b> Generates slots for every day between start and end date. Default time: 8AM-10PM
                    </div>
                    <button type="submit" disabled={generatingSlots} style={{ padding: '0.7rem 1.2rem', background: generatingSlots ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: generatingSlots ? 'not-allowed' : 'pointer', fontSize: '0.95rem', transition: 'all 0.2s' }} onMouseEnter={e => { if (!generatingSlots) e.target.style.background = '#1d4ed8' }} onMouseLeave={e => { if (!generatingSlots) e.target.style.background = '#2563eb' }}>{generatingSlots ? 'Generating...' : 'Generate Slots'}</button>
                  </form>
                ) : (
                  <form onSubmit={addSlot} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
                    <label style={lbl}>Hall
                      <select style={inp} value={slotHallId} onChange={e => setSlotHallId(e.target.value)}>
                        <option value="" disabled>Select hall</option>
                        {halls.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                      </select>
                    </label>
                    <label style={lbl}>Date <input style={inp} type="date" value={slotDate} onChange={e => { setSlotDate(e.target.value); setStartTime(''); setEndTime('') }} /></label>
                    <label style={lbl}>Start Time
                      <select style={inp} value={startTime} onChange={e => { setStartTime(e.target.value); setEndTime('') }}>
                        <option value="">Default (8AM)</option>
                        {TIME_POINTS.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </label>
                    <label style={lbl}>End Time
                      <select style={inp} value={endTime} onChange={e => setEndTime(e.target.value)}>
                        <option value="">Default (10PM)</option>
                        {endTimeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </label>
                    <button type="submit" style={{ padding: '0.65rem 1.2rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Add</button>
                  </form>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                <button onClick={() => setShowBulkDelete(!showBulkDelete)}
                  style={{ padding: '0.6rem 1.5rem', background: showBulkDelete ? '#f1f5f9' : '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                  {showBulkDelete ? '✖ Cancel Bulk Delete' : '🗑️ Bulk Delete Slots'}
                </button>
              </div>
              {showBulkDelete && (
                <div style={card}>
                  <h2 style={{ color: '#0f172a', marginTop: 0, fontSize: '1rem' }}>🗑️ Bulk Delete Slots</h2>
                  <form onSubmit={bulkDeleteSlots} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <label style={lbl}>Hall (optional)
                        <select style={inp} value={deleteHallId} onChange={e => setDeleteHallId(e.target.value)}>
                          <option value="">All Halls</option>
                          {halls.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                        </select>
                      </label>
                      <label style={lbl}>Time Slot (optional)
                        <input style={inp} type="text" value={deleteTimeSlot} onChange={e => setDeleteTimeSlot(e.target.value)} placeholder="e.g. 8AM-12PM" />
                      </label>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <label style={lbl}>Start Date (optional) <input style={inp} type="date" value={deleteStartDate} onChange={e => setDeleteStartDate(e.target.value)} /></label>
                      <label style={lbl}>End Date (optional) <input style={inp} type="date" value={deleteEndDate} onChange={e => setDeleteEndDate(e.target.value)} /></label>
                    </div>
                    <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.5rem', color: '#b91c1c', fontSize: '0.85rem' }}>
                      ⚠️ <b>Warning:</b> This will permanently delete all slots matching the selected filters.
                    </div>
                    <button type="submit" style={{ padding: '0.7rem 1.2rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>🗑️ Delete Matching Slots</button>
                  </form>
                </div>
              )}
              <div style={card}>
                <h2 style={{ color: '#0f172a', marginTop: 0, fontSize: '1rem' }}>All Slots</h2>
                {slotTotal === 0 ? <p style={{ color: '#64748b' }}>No slots yet.</p> : (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                          {['Hall', 'Date', 'Time Slot', 'Status', ''].map(h => <th key={h} style={{ padding: '0.7rem', textAlign: 'left', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {slots.map(s => (
                            <tr key={s._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.75rem', color: '#0f172a', fontSize: '0.875rem' }}>{s.hallId?.name || '—'}</td>
                              <td style={{ padding: '0.75rem', color: '#0f172a', fontSize: '0.875rem' }}>{s.date}</td>
                              <td style={{ padding: '0.75rem', color: '#2563eb', fontWeight: 600, fontSize: '0.875rem' }}>{s.timeSlot}</td>
                              <td style={{ padding: '0.75rem', color: s.isBooked ? '#dc2626' : '#15803d', fontWeight: 600, fontSize: '0.85rem', background: s.isBooked ? '#fee2e2' : 'transparent' }}>{s.isBooked ? 'Booked' : 'Available'}</td>
                              <td style={{ padding: '0.75rem' }}>
                                <button onClick={() => deleteSlot(s._id)} style={deleteBtn} onMouseEnter={e => e.target.style.background = '#fee2e2'} onMouseLeave={e => e.target.style.background = 'transparent'}>Delete</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Rows:</span>
                        <select value={slotLimit} onChange={e => { const l = Number(e.target.value); setSlotLimit(l); setSlotPage(1); fetchSlots(1, l) }}
                          style={{ padding: '0.3rem 0.5rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0.375rem', color: '#0f172a', fontSize: '0.8rem', cursor: 'pointer' }}>
                          {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                          Showing {Math.min((slotPage - 1) * slotLimit + 1, slotTotal)}–{Math.min(slotPage * slotLimit, slotTotal)} of {slotTotal}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <button onClick={() => fetchSlots(1)} disabled={slotPage <= 1}
                          style={{ padding: '0.35rem 0.6rem', background: slotPage <= 1 ? '#f1f5f9' : '#fff', color: slotPage <= 1 ? '#cbd5e1' : '#475569', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: slotPage <= 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>«</button>
                        <button onClick={() => fetchSlots(slotPage - 1)} disabled={slotPage <= 1}
                          style={{ padding: '0.35rem 0.6rem', background: slotPage <= 1 ? '#f1f5f9' : '#fff', color: slotPage <= 1 ? '#cbd5e1' : '#475569', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: slotPage <= 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>‹</button>
                        {(() => {
                          const pages = []
                          const start = Math.max(1, slotPage - 2)
                          const end = Math.min(slotTotalPages, slotPage + 2)
                          if (start > 1) pages.push(<button key="e1" onClick={() => fetchSlots(1)}
                            style={{ padding: '0.35rem 0.6rem', background: '#fff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>1</button>)
                          if (start > 2) pages.push(<span key="d1" style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '0 0.2rem' }}>…</span>)
                          for (let i = start; i <= end; i++) {
                            pages.push(
                              <button key={i} onClick={() => fetchSlots(i)}
                                style={{ padding: '0.35rem 0.6rem', background: i === slotPage ? '#2563eb' : '#fff', color: i === slotPage ? '#fff' : '#475569', border: i === slotPage ? '1px solid #2563eb' : '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>{i}</button>
                            )
                          }
                          if (end < slotTotalPages - 1) pages.push(<span key="d2" style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '0 0.2rem' }}>…</span>)
                          if (end < slotTotalPages) pages.push(<button key="en" onClick={() => fetchSlots(slotTotalPages)}
                            style={{ padding: '0.35rem 0.6rem', background: '#fff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>{slotTotalPages}</button>)
                          return pages
                        })()}
                        <button onClick={() => fetchSlots(slotPage + 1)} disabled={slotPage >= slotTotalPages}
                          style={{ padding: '0.35rem 0.6rem', background: slotPage >= slotTotalPages ? '#f1f5f9' : '#fff', color: slotPage >= slotTotalPages ? '#cbd5e1' : '#475569', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: slotPage >= slotTotalPages ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>›</button>
                        <button onClick={() => fetchSlots(slotTotalPages)} disabled={slotPage >= slotTotalPages}
                          style={{ padding: '0.35rem 0.6rem', background: slotPage >= slotTotalPages ? '#f1f5f9' : '#fff', color: slotPage >= slotTotalPages ? '#cbd5e1' : '#475569', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: slotPage >= slotTotalPages ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>»</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </>}

      </div>
    </main>
  )
}
