import { useState, useEffect } from 'react'
import { Layers, BookOpen, Users, User, Clock, Plus, Trash2, Edit3, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import api from '../services/api'

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

const TABS = [
  { id: 'facilities', label: 'Facilities', icon: Layers },
  { id: 'bookings', label: 'Bookings', icon: BookOpen },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'custodians', label: 'Custodians', icon: User },
  { id: 'slots', label: 'Slots', icon: Clock },
]

const statusColor = (s) =>
  s === 'Approved' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
  s === 'Rejected' ? 'bg-red-500/15 text-red-400 border-red-500/25' :
  'bg-amber-500/15 text-amber-400 border-amber-500/25'

const roleBadge = (role) =>
  role === 'admin' ? 'bg-blue-500/15 text-blue-400 border-blue-500/25' :
  role === 'custodian' ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25' :
  role === 'faculty' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
  'bg-slate-500/15 text-slate-400 border-slate-500/25'

function Flash({ msg }) {
  if (!msg) return null
  const isSuccess = msg.startsWith('✅')
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm mb-5 ${
      isSuccess ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-red-500/10 border-red-500/25 text-red-400'
    }`}>
      {isSuccess ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {msg}
    </div>
  )
}

const inp = 'bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 text-sm focus:border-primary/50 focus:bg-primary/5 outline-none transition-all w-full'
const lbl = 'text-xs font-bold tracking-widest uppercase text-slate-500 mb-2 block'
const btn = 'px-5 py-2.5 rounded-xl text-sm font-bold transition-all'
const primaryBtn = `${btn} bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30`
const logError = (scope, err) => {
  console.error(`[AdminPage] ${scope}`, err)
}

export default function AdminPage() {
  const [tab, setTab] = useState('facilities')
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

  // Custodian form
  const [custodianName, setCustodianName] = useState('')
  const [custodianEmail, setCustodianEmail] = useState('')
  const [tempPassword, setTempPassword] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchHalls(), fetchUsers(), fetchBookings(), fetchSlots()])
    setLoading(false)
  }

  const fetchHalls    = async () => { try { const d = await api.getHalls(); if (d) setHalls(d) } catch (err) { logError('fetchHalls', err) } }
  const fetchUsers    = async () => { try { const d = await api.getUsers(); if (d) setUsers(d) } catch (err) { logError('fetchUsers', err) } }
  const fetchBookings = async () => { try { const d = await api.getGlobalBookings(); if (d) setBookings(d) } catch (err) { logError('fetchBookings', err) } }
  const fetchSlots    = async () => { try { const d = await api.getAllSlots(); if (d) setSlots(d) } catch (err) { logError('fetchSlots', err) } }

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const saveHall = async (e) => {
    e.preventDefault()
    if (!hallName || !hallCapacity) { flash('❌ Name and capacity required.'); return }
    const body = { name: hallName, capacity: Number(hallCapacity), custodianId: hallCustodian || null }
    try {
      if (editHall) { await api.updateHall(editHall._id, body) } else { await api.createHall(body) }
      flash(`✅ Hall ${editHall ? 'updated' : 'created'}.`)
      setHallName(''); setHallCapacity(''); setHallCustodian(''); setEditHall(null); fetchHalls()
    } catch (err) { flash(`❌ ${err?.data?.message || 'Failed to save hall'}`) }
  }

  const deleteHall = async (id) => {
    if (!confirm('Delete this hall?')) return
    try { await api.deleteHall(id); flash('✅ Hall deleted.'); fetchHalls() } catch (err) { logError('deleteHall', err); flash(`❌ ${err?.data?.message || 'Failed to delete hall'}`) }
  }

  const changeRole = async (id, role) => {
    try { await api.changeUserRole(id, role); flash('✅ Role updated.'); fetchUsers() } catch (err) { logError('changeRole', err); flash(`❌ ${err?.data?.message || 'Failed to update role'}`) }
  }

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return
    try { await api.deleteUser(id); flash('✅ User deleted.'); fetchUsers() } catch (err) { logError('deleteUser', err); flash(`❌ ${err?.data?.message || 'Failed to delete user'}`) }
  }

  const createCustodian = async (e) => {
    e.preventDefault()
    if (!custodianName || !custodianEmail) { flash('❌ Name and email required.'); return }
    try {
      const d = await api.createCustodian({ name: custodianName, email: custodianEmail })
      flash('✅ Custodian created.')
      setTempPassword(d.tempPassword)
      setCustodianName(''); setCustodianEmail('')
      fetchUsers()
    } catch (err) { flash(`❌ ${err?.data?.message || 'Failed to create custodian'}`) }
  }

  const updateBooking = async (id, status) => {
    try { await api.updateBookingStatus(id, status); flash(`✅ Booking ${status}.`); fetchBookings(); fetchSlots() } catch (err) { logError('updateBooking', err); flash(`❌ ${err?.data?.message || 'Failed to update booking'}`) }
  }

  const addSlot = async (e) => {
    e.preventDefault()
    if (!slotHallId || !slotDate) { flash('❌ Hall and date are required.'); return }
    const finalStartTime = startTime || '8AM'
    const finalEndTime = endTime || '10PM'
    try {
      await api.createSlot({ hallId: slotHallId, date: slotDate, timeSlot: `${finalStartTime}-${finalEndTime}` })
      flash('✅ Slot added.'); setSlotDate(''); setStartTime(''); setEndTime(''); fetchSlots()
    } catch (err) { flash(`❌ ${err?.data?.message || 'Failed to add slot'}`) }
  }

  const deleteSlot = async (id) => { try { await api.deleteSlot(id); fetchSlots() } catch (err) { logError('deleteSlot', err); flash(`❌ ${err?.data?.message || 'Failed to delete slot'}`) } }

  const custodians = users.filter(u => u.role === 'custodian')
  const endTimeOptions = TIME_POINTS.filter(t => !startTime || toMinutes(t) > toMinutes(startTime))

  const stats = [
    { label: 'Halls', value: halls.length, color: 'text-blue-400' },
    { label: 'Users', value: users.filter(u => u.role !== 'custodian').length, color: 'text-indigo-400' },
    { label: 'Bookings', value: bookings.length, color: 'text-amber-400' },
    { label: 'Available Slots', value: slots.filter(s => !s.isBooked).length, color: 'text-emerald-400' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 pb-32 pt-8 w-full">
      {/* Header */}
      <div className="mb-8">
        <p className="text-primary text-xs uppercase tracking-widest font-bold mb-2">System</p>
        <h1 className="font-headline text-4xl text-white mb-1">Admin Panel</h1>
        <p className="text-slate-500 text-sm">Manage facilities, users, bookings and time slots.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="glass-panel rim-light rounded-2xl p-5 border border-white/5 text-center">
            <p className={`text-3xl font-bold font-headline ${s.color}`}>{s.value}</p>
            <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/3 border border-white/8 rounded-2xl mb-6 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setMsg(''); setEditHall(null) }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${
                tab === t.id
                  ? 'bg-surface-container-highest text-primary shadow-sm'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          )
        })}
      </div>

      <Flash msg={msg} />

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={32} className="animate-spin text-primary/40" />
        </div>
      ) : (
        <>
          {/* ── FACILITIES ── */}
          {tab === 'facilities' && (
            <div className="space-y-6">
              {/* Create/Edit form */}
              <div className="glass-panel rim-light rounded-2xl p-6 border border-white/5">
                <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
                  {editHall ? <><Edit3 size={16} className="text-primary" /> Edit Facility</> : <><Plus size={16} className="text-primary" /> Create Facility</>}
                </h2>
                <form onSubmit={saveHall} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Hall Name</label>
                    <input className={inp} value={hallName} onChange={e => setHallName(e.target.value)} placeholder="e.g. Auditorium" />
                  </div>
                  <div>
                    <label className={lbl}>Capacity</label>
                    <input className={inp} type="number" value={hallCapacity} onChange={e => setHallCapacity(e.target.value)} placeholder="e.g. 500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className={lbl}>Assign Custodian</label>
                    <select className={inp} value={hallCustodian} onChange={e => setHallCustodian(e.target.value)}>
                      <option value="">— None —</option>
                      {custodians.map(c => <option key={c._id} value={c._id}>{c.name} ({c.email})</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2 flex gap-3">
                    <button type="submit" className={primaryBtn}>{editHall ? 'Update Hall' : 'Create Hall'}</button>
                    {editHall && (
                      <button type="button" onClick={() => { setEditHall(null); setHallName(''); setHallCapacity(''); setHallCustodian('') }}
                        className={`${btn} bg-transparent border border-white/10 text-slate-400 hover:text-white hover:bg-white/5`}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Halls table */}
              <div className="glass-panel rim-light rounded-2xl p-6 border border-white/5 overflow-x-auto">
                <h2 className="text-white font-semibold mb-5">All Facilities</h2>
                {halls.length === 0 ? (
                  <p className="text-slate-500 text-sm py-6 text-center">No halls yet. Create one above.</p>
                ) : (
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-white/8">
                        {['Hall', 'Capacity', 'Custodian', 'Actions'].map(h => (
                          <th key={h} className="py-3 px-4 text-left text-[10px] uppercase tracking-widest text-slate-500 font-bold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {halls.map(h => (
                        <tr key={h._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                          <td className="py-3.5 px-4 text-white font-medium">{h.name}</td>
                          <td className="py-3.5 px-4 text-slate-400">{h.capacity}</td>
                          <td className="py-3.5 px-4 text-slate-400 text-xs">
                            {h.custodianId ? `${h.custodianId.name}` : <span className="text-slate-600">— Unassigned —</span>}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex gap-2">
                              <button onClick={() => { setEditHall(h); setHallName(h.name); setHallCapacity(h.capacity); setHallCustodian(h.custodianId?._id || ''); setTab('facilities') }}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/10 border border-blue-500/25 text-blue-400 hover:bg-blue-500/20 transition-colors">Edit</button>
                              <button onClick={() => deleteHall(h._id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-transparent border border-red-500/25 text-red-400 hover:bg-red-500/10 transition-colors">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── BOOKINGS ── */}
          {tab === 'bookings' && (
            <div className="glass-panel rim-light rounded-2xl p-6 border border-white/5 overflow-x-auto">
              <h2 className="text-white font-semibold mb-5">All Bookings</h2>
              {bookings.length === 0 ? (
                <p className="text-slate-500 text-sm py-6 text-center">No bookings yet.</p>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/8">
                      {['User', 'Hall', 'Date', 'Slot', 'Message', 'Status', 'Action'].map(h => (
                        <th key={h} className="py-3 px-3 text-left text-[10px] uppercase tracking-widest text-slate-500 font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="py-3.5 px-3">
                          <p className="text-white text-xs font-medium">{b.userId?.name}</p>
                          <p className="text-slate-500 text-[10px]">{b.userId?.email}</p>
                        </td>
                        <td className="py-3.5 px-3 text-slate-300 text-xs">{b.hallId?.name}</td>
                        <td className="py-3.5 px-3 text-slate-300 text-xs">{b.slotId?.date}</td>
                        <td className="py-3.5 px-3 text-primary text-xs font-semibold">{b.slotId?.timeSlot}</td>
                        <td className="py-3.5 px-3 text-slate-500 text-xs max-w-[130px] truncate">{b.message || '—'}</td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${statusColor(b.status)}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          {b.status === 'Pending' && (
                            <div className="flex gap-1.5">
                              <button onClick={() => updateBooking(b._id, 'Approved')}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 transition-colors">✓</button>
                              <button onClick={() => updateBooking(b._id, 'Rejected')}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 transition-colors">✗</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── USERS ── */}
          {tab === 'users' && (
            <div className="glass-panel rim-light rounded-2xl p-6 border border-white/5 overflow-x-auto">
              <h2 className="text-white font-semibold mb-5">Manage Users</h2>
              {users.filter(u => u.role !== 'custodian').length === 0 ? (
                <p className="text-slate-500 text-sm py-6 text-center">No users found.</p>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/8">
                      {['Name', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                        <th key={h} className="py-3 px-4 text-left text-[10px] uppercase tracking-widest text-slate-500 font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.role !== 'custodian').map(u => (
                      <tr key={u._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="py-3.5 px-4 text-white font-medium text-sm">{u.name}</td>
                        <td className="py-3.5 px-4 text-slate-400 text-xs">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${roleBadge(u.role)}`}>{u.role}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={u.role}
                              onChange={e => changeRole(u._id, e.target.value)}
                              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-primary/50 cursor-pointer"
                            >
                              <option value="student">student</option>
                              <option value="faculty">faculty</option>
                              <option value="admin">admin</option>
                            </select>
                            <button onClick={() => deleteUser(u._id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-transparent border border-red-500/25 text-red-400 hover:bg-red-500/10 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── CUSTODIANS ── */}
          {tab === 'custodians' && (
            <div className="space-y-6">
              <div className="glass-panel rim-light rounded-2xl p-6 border border-white/5">
                <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
                  <Plus size={16} className="text-primary" /> Create Custodian
                </h2>
                <form onSubmit={createCustodian} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Full Name</label>
                    <input className={inp} value={custodianName} onChange={e => setCustodianName(e.target.value)} placeholder="Jane Smith" />
                  </div>
                  <div>
                    <label className={lbl}>Email</label>
                    <input className={inp} type="email" value={custodianEmail} onChange={e => setCustodianEmail(e.target.value)} placeholder="jane@college.edu" />
                  </div>
                  <div className="md:col-span-2">
                    <button type="submit" className={primaryBtn}>Create Custodian</button>
                  </div>
                </form>
                {tempPassword && (
                  <div className="mt-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm flex items-start gap-3">
                    <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                    <span>Custodian created. Temporary password: <strong className="font-mono">{tempPassword}</strong></span>
                  </div>
                )}
              </div>

              <div className="glass-panel rim-light rounded-2xl p-6 border border-white/5 overflow-x-auto">
                <h2 className="text-white font-semibold mb-5">All Custodians</h2>
                {custodians.length === 0 ? (
                  <p className="text-slate-500 text-sm py-6 text-center">No custodians found.</p>
                ) : (
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-white/8">
                        {['Name', 'Email', 'Assigned Halls', 'Joined', 'Actions'].map(h => (
                          <th key={h} className="py-3 px-4 text-left text-[10px] uppercase tracking-widest text-slate-500 font-bold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {custodians.map(u => (
                        <tr key={u._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                          <td className="py-3.5 px-4 text-white font-medium text-sm">{u.name}</td>
                          <td className="py-3.5 px-4 text-slate-400 text-xs">{u.email}</td>
                          <td className="py-3.5 px-4 text-indigo-400 text-xs">
                            {halls.filter(h => h.custodianId?._id === u._id).map(h => h.name).join(', ') || '— None —'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="py-3.5 px-4">
                            <button onClick={() => deleteUser(u._id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-transparent border border-red-500/25 text-red-400 hover:bg-red-500/10 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── SLOTS ── */}
          {tab === 'slots' && (
            <div className="space-y-6">
              <div className="glass-panel rim-light rounded-2xl p-6 border border-white/5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <Plus size={16} className="text-primary" />
                    {bulkMode ? 'Bulk Generate Slots' : 'Add Single Slot'}
                  </h2>
                  <button
                    onClick={() => { setBulkMode(!bulkMode); setSlotDate(''); setBulkStartDate(''); setBulkEndDate(''); setStartTime(''); setEndTime('') }}
                    className={`text-xs font-bold px-3 py-2 rounded-lg border transition-colors ${bulkMode ? 'border-primary/40 text-primary bg-primary/10' : 'border-white/15 text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    {bulkMode ? '📅 Single' : '📆 Bulk'}
                  </button>
                </div>

                <form onSubmit={addSlot} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={lbl}>Hall</label>
                    <select className={inp} value={slotHallId} onChange={e => setSlotHallId(e.target.value)}>
                      <option value="" disabled>Select hall…</option>
                      {halls.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                    </select>
                  </div>
                  {bulkMode ? (
                    <>
                      <div>
                        <label className={lbl}>Start Date</label>
                        <input className={inp} type="date" value={bulkStartDate} onChange={e => setBulkStartDate(e.target.value)} required />
                      </div>
                      <div>
                        <label className={lbl}>End Date</label>
                        <input className={inp} type="date" value={bulkEndDate} onChange={e => setBulkEndDate(e.target.value)} required />
                      </div>
                    </>
                  ) : (
                    <div className="md:col-span-2">
                      <label className={lbl}>Date</label>
                      <input className={inp} type="date" value={slotDate} onChange={e => { setSlotDate(e.target.value); setStartTime(''); setEndTime('') }} />
                    </div>
                  )}
                  <div>
                    <label className={lbl}>Start Time</label>
                    <select className={inp} value={startTime} onChange={e => { setStartTime(e.target.value); setEndTime('') }}>
                      <option value="">Default (8AM)</option>
                      {TIME_POINTS.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>End Time</label>
                    <select className={inp} value={endTime} onChange={e => setEndTime(e.target.value)}>
                      <option value="">Default (10PM)</option>
                      {endTimeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <button type="submit" className={primaryBtn}>
                      {bulkMode ? '🚀 Generate Slots' : 'Add Slot'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="glass-panel rim-light rounded-2xl p-6 border border-white/5 overflow-x-auto">
                <h2 className="text-white font-semibold mb-5">All Slots ({slots.length})</h2>
                {slots.length === 0 ? (
                  <p className="text-slate-500 text-sm py-6 text-center">No slots yet.</p>
                ) : (
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-white/8">
                        {['Hall', 'Date', 'Time Slot', 'Status', ''].map(h => (
                          <th key={h} className="py-3 px-4 text-left text-[10px] uppercase tracking-widest text-slate-500 font-bold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {slots.map(s => (
                        <tr key={s._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                          <td className="py-3.5 px-4 text-white text-sm">{s.hallId?.name || '—'}</td>
                          <td className="py-3.5 px-4 text-slate-300 text-sm">{s.date}</td>
                          <td className="py-3.5 px-4 text-primary font-semibold text-sm">{s.timeSlot}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${s.isBooked ? 'bg-red-500/15 text-red-400 border-red-500/25' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'}`}>
                              {s.isBooked ? 'Booked' : 'Available'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <button onClick={() => deleteSlot(s._id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-transparent border border-red-500/25 text-red-400 hover:bg-red-500/10 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
