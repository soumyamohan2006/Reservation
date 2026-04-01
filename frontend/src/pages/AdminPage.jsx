import { useState, useEffect } from 'react'
import { API_URL } from '../config'

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

const card = { background: '#0f172a', border: '1px solid #1e3a8a', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.5rem' }
const badge = (role) => ({
  padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
  background: role === 'admin' ? '#1e3a8a' : role === 'custodian' ? '#1e1b4b' : role === 'faculty' ? '#0f2a1a' : '#1e293b',
  color: role === 'admin' ? '#93c5fd' : role === 'custodian' ? '#a5b4fc' : role === 'faculty' ? '#86efac' : '#94a3b8',
})
const statusColor = (s) => s === 'Approved' ? '#86efac' : s === 'Rejected' ? '#fca5a5' : '#fde68a'

const TABS = ['🏛️ Facilities', '📋 Bookings', '👥 Users', '👤 Custodians', '🕐 Slots']

export default function AdminPage({ token }) {
  const [tab, setTab] = useState('🏛️ Facilities')
  const [halls, setHalls] = useState([])
  const [users, setUsers] = useState([])
  const [bookings, setBookings] = useState([])
  const [slots, setSlots] = useState([])
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
    await Promise.all([fetchHalls(), fetchUsers(), fetchBookings(), fetchSlots()])
    setLoading(false)
  }

  const fetchHalls    = async () => { try { const r = await api('/halls'); const d = await r.json(); if (r.ok) setHalls(d) } catch {} }
  const fetchUsers    = async () => { try { const r = await api('/users'); const d = await r.json(); if (r.ok) setUsers(d) } catch {} }
  const fetchBookings = async () => { try { const r = await api('/bookings'); const d = await r.json(); if (r.ok) setBookings(d) } catch {} }
  const fetchSlots    = async () => { try { const r = await api('/slots'); const d = await r.json(); if (r.ok) setSlots(d) } catch {} }

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
    await api(`/users/${id}`, { method: 'DELETE' }); flash('✅ User deleted.'); fetchUsers()
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
      
      const r = await api('/slots', { method: 'POST', body: JSON.stringify(body) })
      const d = await r.json()
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

  const deleteSlot = async (id) => { await api(`/slots/${id}`, { method: 'DELETE' }); fetchSlots() }

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
      fetchSlots()
    } else flash(`❌ ${d.message}`)
  }

  const custodians = users.filter(u => u.role === 'custodian')
  const endTimeOptions = TIME_POINTS.filter(t => !startTime || toMinutes(t) > toMinutes(startTime))

  const inp = { padding: '0.65rem 0.9rem', background: '#020b2f', border: '1px solid #1e3a8a', borderRadius: '0.5rem', color: '#fff', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }
  const lbl = { color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: '0.35rem' }
  const editBtn = { padding: '0.3rem 0.7rem', background: '#1e3a8a', border: 'none', borderRadius: '0.375rem', color: '#93c5fd', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }
  const deleteBtn = { padding: '0.3rem 0.7rem', background: 'transparent', border: '1px solid #b91c1c', borderRadius: '0.375rem', color: '#fca5a5', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }

  return (
    <main style={{ minHeight: '100vh', background: '#020b2f', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.2rem' }}>🛡️</div>
          <div>
            <h1 style={{ color: '#fff', margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Admin Panel</h1>
            <p style={{ color: '#475569', margin: 0, fontSize: '0.85rem' }}>Manage facilities, users, bookings and slots</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
            {[
              { label: 'Halls', val: halls.length, color: '#93c5fd' },
              { label: 'Users', val: users.length, color: '#a5b4fc' },
              { label: 'Bookings', val: bookings.length, color: '#fde68a' },
            ].map(s => (
              <div key={s.label} style={{ ...card, padding: '0.6rem 1rem', marginBottom: 0, textAlign: 'center', minWidth: '70px' }}>
                <div style={{ color: s.color, fontSize: '1.3rem', fontWeight: 800 }}>{s.val}</div>
                <div style={{ color: '#475569', fontSize: '0.7rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', borderBottom: '1px solid #1e3a8a', paddingBottom: 0 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => { setTab(t); setMsg(''); setEditHall(null) }}
              style={{ padding: '0.55rem 1.1rem', background: tab === t ? '#1e3a8a' : 'transparent', color: tab === t ? '#fff' : '#475569', border: 'none', borderRadius: '0.5rem 0.5rem 0 0', cursor: 'pointer', fontWeight: tab === t ? 700 : 400, fontSize: '0.875rem' }}>
              {t}
            </button>
          ))}
        </div>

        {msg && <div style={{ padding: '0.7rem 1rem', background: msg.startsWith('✅') ? '#14532d' : '#450a0a', border: `1px solid ${msg.startsWith('✅') ? '#16a34a' : '#b91c1c'}`, borderRadius: '0.5rem', color: msg.startsWith('✅') ? '#86efac' : '#fca5a5', marginBottom: '1rem', fontSize: '0.875rem' }}>{msg}</div>}

        {loading ? <div style={{ color: '#475569', textAlign: 'center', padding: '3rem' }}>Loading...</div> : <>

          {/* ── FACILITIES TAB ── */}
          {tab === '🏛️ Facilities' && (
            <>
              <div style={card}>
                <h2 style={{ color: '#fff', marginTop: 0, fontSize: '1rem' }}>{editHall ? '✏️ Edit Facility' : '➕ Create Facility'}</h2>
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
                    {editHall && <button type="button" onClick={() => { setEditHall(null); setHallName(''); setHallCapacity(''); setHallCustodian('') }} style={{ padding: '0.65rem 0.9rem', background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>}
                  </div>
                </form>
              </div>

              <div style={card}>
                <h2 style={{ color: '#fff', marginTop: 0, fontSize: '1rem' }}>All Facilities</h2>
                {halls.length === 0 ? <p style={{ color: '#475569' }}>No halls yet.</p> : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '2px solid #1e3a8a' }}>
                        {['Hall', 'Capacity', 'Custodian', 'Actions'].map(h => <th key={h} style={{ padding: '0.7rem', textAlign: 'left', color: '#475569', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {halls.map(h => (
                          <tr key={h._id} style={{ borderBottom: '1px solid #1e293b' }}>
                            <td style={{ padding: '0.75rem', color: '#e2e8f0', fontWeight: 600 }}>{h.name}</td>
                            <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{h.capacity}</td>
                            <td style={{ padding: '0.75rem', color: h.custodianId ? '#a5b4fc' : '#334155', fontSize: '0.85rem' }}>
                              {h.custodianId ? `${h.custodianId.name} (${h.custodianId.email})` : '— Unassigned —'}
                            </td>
                            <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => startEditHall(h)} style={editBtn} onMouseEnter={e => e.target.style.background = '#2563eb'} onMouseLeave={e => e.target.style.background = '#1e3a8a'}>Edit</button>
                              <button onClick={() => deleteHall(h._id)} style={deleteBtn} onMouseEnter={e => e.target.style.background = '#450a0a'} onMouseLeave={e => e.target.style.background = 'transparent'}>Delete</button>
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
              <h2 style={{ color: '#fff', marginTop: 0, fontSize: '1rem' }}>All Bookings</h2>
              {bookings.length === 0 ? <p style={{ color: '#475569' }}>No bookings yet.</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: '2px solid #1e3a8a' }}>
                      {['User', 'Hall', 'Date', 'Time Slot', 'Message', 'Status', 'Action'].map(h => <th key={h} style={{ padding: '0.7rem', textAlign: 'left', color: '#475569', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b._id} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{b.userId?.name}</div>
                            <div style={{ color: '#475569', fontSize: '0.75rem' }}>{b.userId?.email}</div>
                          </td>
                          <td style={{ padding: '0.75rem', color: '#e2e8f0', fontSize: '0.875rem' }}>{b.hallId?.name}</td>
                          <td style={{ padding: '0.75rem', color: '#e2e8f0', fontSize: '0.875rem' }}>{b.slotId?.date}</td>
                          <td style={{ padding: '0.75rem', color: '#93c5fd', fontWeight: 600, fontSize: '0.875rem' }}>{b.slotId?.timeSlot}</td>
                          <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.8rem', maxWidth: '140px' }}>{b.message || '—'}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 700, color: statusColor(b.status), fontSize: '0.85rem' }}>{b.status}</td>
                          <td style={{ padding: '0.75rem' }}>
                            {b.status === 'Pending' && (
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button onClick={() => updateBooking(b._id, 'Approved')} style={{ padding: '0.3rem 0.6rem', background: '#14532d', border: '1px solid #16a34a', borderRadius: '0.375rem', color: '#86efac', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>✅</button>
                                <button onClick={() => updateBooking(b._id, 'Rejected')} style={{ padding: '0.3rem 0.6rem', background: '#450a0a', border: '1px solid #b91c1c', borderRadius: '0.375rem', color: '#fca5a5', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>❌</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── USERS TAB ── */}
          {tab === '👥 Users' && (
            <div style={card}>
              <h2 style={{ color: '#fff', marginTop: 0, fontSize: '1rem' }}>Manage Users</h2>
              {users.filter(u => u.role !== 'custodian').length === 0 ? <p style={{ color: '#475569' }}>No users found.</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: '2px solid #1e3a8a' }}>
                      {['Name', 'Email', 'Role', 'Joined', 'Actions'].map(h => <th key={h} style={{ padding: '0.7rem', textAlign: 'left', color: '#475569', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {users.filter(u => u.role !== 'custodian').map(u => (
                        <tr key={u._id} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '0.75rem', color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 600 }}>{u.name}</td>
                          <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.8rem' }}>{u.email}</td>
                          <td style={{ padding: '0.75rem' }}><span style={badge(u.role)}>{u.role}</span></td>
                          <td style={{ padding: '0.75rem', color: '#475569', fontSize: '0.8rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                              <select value={u.role} onChange={e => changeRole(u._id, e.target.value)}
                                style={{ padding: '0.3rem 0.5rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.375rem', color: '#e2e8f0', fontSize: '0.8rem', cursor: 'pointer' }}>
                                <option value="student">student</option>
                                <option value="faculty">faculty</option>
                                <option value="admin">admin</option>
                              </select>
                              <button onClick={() => deleteUser(u._id)} style={{ ...deleteBtn, fontSize: '0.75rem' }} onMouseEnter={e => e.target.style.background = '#450a0a'} onMouseLeave={e => e.target.style.background = 'transparent'}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── CUSTODIANS TAB ── */}
          {tab === '👤 Custodians' && (
            <>
              <div style={card}>
                <h2 style={{ color: '#fff', marginTop: 0, fontSize: '1rem' }}>➕ Create Custodian</h2>
                <form onSubmit={createCustodian} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
                  <label style={lbl}>Name <input style={inp} value={custodianName} onChange={e => setCustodianName(e.target.value)} placeholder="Full name" /></label>
                  <label style={lbl}>Email <input style={inp} type="email" value={custodianEmail} onChange={e => setCustodianEmail(e.target.value)} placeholder="email@example.com" /></label>
                  <button type="submit" style={{ padding: '0.65rem 1.2rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Create</button>
                </form>
                {tempPassword && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#14532d', border: '1px solid #16a34a', borderRadius: '0.5rem', color: '#86efac', fontSize: '0.875rem' }}>
                    ✅ Custodian created. Temporary password: <strong>{tempPassword}</strong> (share this with the custodian)
                  </div>
                )}
              </div>

              <div style={card}>
              <h2 style={{ color: '#fff', marginTop: 0, fontSize: '1rem' }}>All Custodians</h2>
              {custodians.length === 0 ? <p style={{ color: '#475569' }}>No custodians found.</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: '2px solid #1e3a8a' }}>
                      {['Name', 'Email', 'Assigned Halls', 'Joined', 'Actions'].map(h => <th key={h} style={{ padding: '0.7rem', textAlign: 'left', color: '#475569', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {custodians.map(u => (
                        <tr key={u._id} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '0.75rem', color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 600 }}>{u.name}</td>
                          <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.8rem' }}>{u.email}</td>
                          <td style={{ padding: '0.75rem', color: '#a5b4fc', fontSize: '0.8rem' }}>
                            {halls.filter(h => h.custodianId?._id === u._id).map(h => h.name).join(', ') || '— None —'}
                          </td>
                          <td style={{ padding: '0.75rem', color: '#475569', fontSize: '0.8rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <button onClick={() => deleteUser(u._id)} style={{ ...deleteBtn, fontSize: '0.75rem' }} onMouseEnter={e => e.target.style.background = '#450a0a'} onMouseLeave={e => e.target.style.background = 'transparent'}>Delete</button>
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
                  <h2 style={{ color: '#fff', margin: 0, fontSize: '1rem' }}>➕ {bulkMode ? 'Generate Slots (Bulk)' : 'Add Single Slot'}</h2>
                  <button onClick={() => { setBulkMode(!bulkMode); setSlotDate(''); setBulkStartDate(''); setBulkEndDate(''); setStartTime(''); setEndTime('') }}
                    style={{ padding: '0.5rem 1rem', background: bulkMode ? '#7c3aed' : '#1e3a8a', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
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
                      <label style={lbl}>Start Date
                        <input style={inp} type="date" value={bulkStartDate} onChange={e => setBulkStartDate(e.target.value)} required />
                      </label>
                      <label style={lbl}>End Date
                        <input style={inp} type="date" value={bulkEndDate} onChange={e => setBulkEndDate(e.target.value)} required />
                      </label>
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
                    <div style={{ padding: '0.75rem', background: '#1e1b4b', border: '1px solid #4338ca', borderRadius: '0.5rem', color: '#a5b4fc', fontSize: '0.85rem' }}>
                      💡 <b>Bulk Mode:</b> Generates slots for every day between start and end date. Default time: 8AM-10PM (08:00-22:00)
                    </div>
                    <button type="submit" style={{ padding: '0.7rem 1.2rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
                      🚀 Generate Slots
                    </button>
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
                    <label style={lbl}>Start Time (default: 8AM)
                      <select style={inp} value={startTime} onChange={e => { setStartTime(e.target.value); setEndTime('') }}>
                        <option value="">Default (8AM)</option>
                        {TIME_POINTS.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </label>
                    <label style={lbl}>End Time (default: 12PM)
                      <select style={inp} value={endTime} onChange={e => setEndTime(e.target.value)}>
                        <option value="">Default (12PM)</option>
                        {endTimeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </label>
                    <button type="submit" style={{ padding: '0.65rem 1.2rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Add</button>
                  </form>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <button onClick={() => setShowBulkDelete(!showBulkDelete)}
                  style={{ padding: '0.6rem 1.5rem', background: showBulkDelete ? 'transparent' : '#450a0a', color: '#fca5a5', border: '1px solid #b91c1c', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                  {showBulkDelete ? '✖ Cancel Bulk Delete' : '🗑️ Bulk Delete Slots'}
                </button>
              </div>

              {showBulkDelete && (
                <div style={card}>
                  <h2 style={{ color: '#fff', marginTop: 0, fontSize: '1rem' }}>🗑️ Bulk Delete Slots</h2>
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
                      <label style={lbl}>Start Date (optional)
                        <input style={inp} type="date" value={deleteStartDate} onChange={e => setDeleteStartDate(e.target.value)} />
                      </label>
                      <label style={lbl}>End Date (optional)
                        <input style={inp} type="date" value={deleteEndDate} onChange={e => setDeleteEndDate(e.target.value)} />
                      </label>
                    </div>
                    <div style={{ padding: '0.75rem', background: '#450a0a', border: '1px solid #b91c1c', borderRadius: '0.5rem', color: '#fca5a5', fontSize: '0.85rem' }}>
                      ⚠️ <b>Warning:</b> This will permanently delete all slots matching the selected filters.
                    </div>
                    <button type="submit" style={{ padding: '0.7rem 1.2rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
                      🗑️ Delete Matching Slots
                    </button>
                  </form>
                </div>
              )}

              <div style={card}>
                <h2 style={{ color: '#fff', marginTop: 0, fontSize: '1rem' }}>All Slots</h2>
                {slots.length === 0 ? <p style={{ color: '#475569' }}>No slots yet.</p> : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '2px solid #1e3a8a' }}>
                        {['Hall', 'Date', 'Time Slot', 'Status', ''].map(h => <th key={h} style={{ padding: '0.7rem', textAlign: 'left', color: '#475569', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {slots.map(s => (
                          <tr key={s._id} style={{ borderBottom: '1px solid #1e293b' }}>
                            <td style={{ padding: '0.75rem', color: '#e2e8f0', fontSize: '0.875rem' }}>{s.hallId?.name || '—'}</td>
                            <td style={{ padding: '0.75rem', color: '#e2e8f0', fontSize: '0.875rem' }}>{s.date}</td>
                            <td style={{ padding: '0.75rem', color: '#93c5fd', fontWeight: 600, fontSize: '0.875rem' }}>{s.timeSlot}</td>
                            <td style={{ padding: '0.75rem', color: s.isBooked ? '#fca5a5' : '#86efac', fontWeight: 600, fontSize: '0.85rem' }}>{s.isBooked ? 'Booked' : 'Available'}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <button onClick={() => deleteSlot(s._id)} style={{ ...deleteBtn, fontSize: '0.75rem' }} onMouseEnter={e => e.target.style.background = '#450a0a'} onMouseLeave={e => e.target.style.background = 'transparent'}>Delete</button>
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
        </>}
      </div>
    </main>
  )
}
