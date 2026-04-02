import { useState, useEffect } from 'react'
import { BookOpen, CalendarDays, Ban, Clock, CheckCircle2, AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react'
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
  { id: 'requests', label: 'Requests', icon: BookOpen },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'unavailable', label: 'Block Slot', icon: Ban },
  { id: 'history', label: 'History', icon: Clock },
]

const inp = 'bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 text-sm focus:border-primary/50 focus:bg-primary/5 outline-none transition-all w-full [color-scheme:dark]'
const lbl = 'text-xs font-bold tracking-widest uppercase text-slate-500 mb-2 block'

const logError = (scope, err) => {
  console.error(`[CustodianPage] ${scope}`, err)
}

function Flash({ msg }) {
  if (!msg) return null
  const ok = msg.startsWith('✅')
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm mb-5 ${ok ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-red-500/10 border-red-500/25 text-red-400'}`}>
      {ok ? <CheckCircle2 size={15} className="flex-shrink-0" /> : <AlertCircle size={15} className="flex-shrink-0" />}
      {msg}
    </div>
  )
}

export default function CustodianPage({ user }) {
  const [tab, setTab] = useState('requests')
  const [bookings, setBookings] = useState([])
  const [slots, setSlots] = useState([])
  const [halls, setHalls] = useState([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  // Block slot form state
  const [hallId, setHallId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [slotMsg, setSlotMsg] = useState('')
  const [blocking, setBlocking] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchBookings(), fetchSlots(), fetchHalls()])
    setLoading(false)
  }

  const fetchBookings = async () => {
    try { const d = await api.getCustodianBookings(); if (Array.isArray(d)) setBookings(d) } catch (err) { logError('fetchBookings', err) }
  }
  const fetchSlots = async () => {
    try { const d = await api.getCustodianSlots(); if (Array.isArray(d)) setSlots(d) } catch (err) { logError('fetchSlots', err) }
  }
  const fetchHalls = async () => {
    try { const d = await api.getCustodianHalls(); if (Array.isArray(d)) setHalls(d) } catch (err) { logError('fetchHalls', err) }
  }

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const updateStatus = async (id, status) => {
    try {
      await api.updateBookingStatus(id, status)
      flash(`✅ Booking ${status}.`)
      fetchAll()
    } catch (err) {
      flash(`❌ ${err?.data?.message || 'Failed to update booking.'}`)
    }
  }

  const markUnavailable = async (e) => {
    e.preventDefault()
    if (!hallId || !date || !startTime || !endTime) { setSlotMsg('❌ All fields are required.'); return }
    setBlocking(true)
    setSlotMsg('')
    try {
      await api.createSlot({ hallId, date, timeSlot: `${startTime}-${endTime}`, isBooked: true })
      setSlotMsg('✅ Slot blocked successfully.')
      setDate(''); setStartTime(''); setEndTime('')
      fetchSlots()
    } catch (err) {
      setSlotMsg(`❌ ${err?.data?.message || 'Server error.'}`)
    } finally {
      setBlocking(false)
    }
  }

  const deleteSlot = async (id) => {
    try { await api.deleteSlot(id); fetchSlots() } catch (err) { logError('deleteSlot', err) }
  }

  const pending = bookings.filter(b => b.status === 'Pending')
  const history = bookings.filter(b => b.status !== 'Pending')
  const today = new Date().toISOString().split('T')[0]
  const upcoming = slots.filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const blocked = slots.filter(s => s.isBooked)
  const endTimeOptions = TIME_POINTS.filter(t => !startTime || toMinutes(t) > toMinutes(startTime))

  const stats = [
    { label: 'Pending', value: pending.length, color: 'text-amber-400' },
    { label: 'Approved', value: bookings.filter(b => b.status === 'Approved').length, color: 'text-emerald-400' },
    { label: 'Upcoming Slots', value: upcoming.length, color: 'text-blue-400' },
    { label: 'Blocked', value: blocked.length, color: 'text-red-400' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-6 pb-32 pt-8 w-full">
      {/* Header */}
      <div className="mb-8">
        <p className="text-primary text-xs uppercase tracking-widest font-bold mb-2">Custodian Portal</p>
        <h1 className="font-headline text-4xl text-white mb-1">Welcome, {user || 'Custodian'}</h1>
        <p className="text-slate-500 text-sm">Manage booking requests and schedule for your assigned halls.</p>
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
              onClick={() => { setTab(t.id); setMsg('') }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${
                tab === t.id
                  ? 'bg-surface-container-highest text-primary shadow-sm'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              <Icon size={15} />
              {t.label}
              {t.id === 'requests' && pending.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                  {pending.length}
                </span>
              )}
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
          {/* ── REQUESTS ── */}
          {tab === 'requests' && (
            <div className="space-y-4">
              {pending.length === 0 ? (
                <div className="glass-panel rim-light rounded-2xl p-12 border border-white/5 flex flex-col items-center gap-3 text-center">
                  <CheckCircle2 size={40} className="text-slate-700" strokeWidth={1} />
                  <p className="text-white font-headline text-xl">All clear!</p>
                  <p className="text-slate-500 text-sm">No pending booking requests at this time.</p>
                </div>
              ) : (
                pending.map(b => (
                  <div key={b._id} className="glass-panel rim-light rounded-2xl p-6 border border-white/5 border-l-2 border-l-amber-500/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <p className="text-white font-semibold">{b.userId?.name}</p>
                          <span className="text-slate-600 text-xs">{b.userId?.email}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays size={13} className="text-primary" />
                            {b.hallId?.name}
                          </span>
                          <span className="text-slate-700">·</span>
                          <span>{b.slotId?.date}</span>
                          <span className="text-slate-700">·</span>
                          <span className="text-primary font-medium">{b.slotId?.timeSlot}</span>
                        </div>
                        {b.message && (
                          <p className="text-slate-500 text-xs border-l-2 border-white/10 pl-3 mt-1">
                            {b.message}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-3 flex-shrink-0">
                        <button
                          onClick={() => updateStatus(b._id, 'Approved')}
                          className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => updateStatus(b._id, 'Rejected')}
                          className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── SCHEDULE ── */}
          {tab === 'schedule' && (
            <div className="glass-panel rim-light rounded-2xl p-6 border border-white/5 overflow-x-auto">
              <h2 className="text-white font-semibold mb-5">Upcoming Schedule</h2>
              {upcoming.length === 0 ? (
                <p className="text-slate-500 text-sm py-8 text-center">No upcoming slots.</p>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/8">
                      {['Hall', 'Date', 'Time Slot', 'Status'].map(h => (
                        <th key={h} className="py-3 px-4 text-left text-[10px] uppercase tracking-widest text-slate-500 font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map(s => (
                      <tr key={s._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="py-3.5 px-4 text-white text-sm">{s.hallId?.name || '—'}</td>
                        <td className="py-3.5 px-4 text-slate-300 text-sm">{s.date}</td>
                        <td className="py-3.5 px-4 text-primary font-semibold text-sm">{s.timeSlot}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                            s.isBooked ? 'bg-red-500/15 text-red-400 border-red-500/25' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                          }`}>
                            {s.isBooked ? 'Booked' : 'Available'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── BLOCK SLOT ── */}
          {tab === 'unavailable' && (
            <div className="space-y-6">
              <div className="glass-panel rim-light rounded-2xl p-6 border border-white/5">
                <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
                  <Ban size={16} className="text-red-400" /> Block a Time Slot
                </h2>
                <p className="text-slate-500 text-sm mb-6">Prevent users from booking this time window.</p>

                <form onSubmit={markUnavailable} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={lbl}>Hall</label>
                      <select className={inp} value={hallId} onChange={e => setHallId(e.target.value)}>
                        <option value="" disabled>Select a hall…</option>
                        {halls.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={lbl}>Date</label>
                      <input type="date" className={inp} value={date} onChange={e => { setDate(e.target.value); setStartTime(''); setEndTime('') }} />
                    </div>
                    <div>
                      <label className={lbl}>Start Time</label>
                      <select className={inp} value={startTime} onChange={e => { setStartTime(e.target.value); setEndTime('') }}>
                        <option value="" disabled>Select start…</option>
                        {TIME_POINTS.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>End Time</label>
                      <select className={inp} value={endTime} onChange={e => setEndTime(e.target.value)} disabled={!startTime}>
                        <option value="" disabled>Select end…</option>
                        {endTimeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {slotMsg && (
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${
                      slotMsg.startsWith('✅') ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-red-500/10 border-red-500/25 text-red-400'
                    }`}>
                      {slotMsg.startsWith('✅') ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      {slotMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={blocking}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {blocking ? <><Loader2 size={15} className="animate-spin" /> Blocking…</> : <><Ban size={15} /> Block Slot</>}
                  </button>
                </form>
              </div>

              {/* Blocked slots list */}
              <div className="glass-panel rim-light rounded-2xl p-6 border border-white/5">
                <h2 className="text-white font-semibold mb-5">Blocked Slots ({blocked.length})</h2>
                {blocked.length === 0 ? (
                  <p className="text-slate-500 text-sm py-6 text-center">No blocked slots.</p>
                ) : (
                  <div className="space-y-3">
                    {blocked.map(s => (
                      <div key={s._id} className="flex items-center justify-between px-4 py-3 bg-red-500/5 border border-red-500/15 rounded-xl">
                        <div className="text-sm">
                          <span className="text-white font-medium">{s.hallId?.name}</span>
                          <span className="text-slate-500 mx-2">·</span>
                          <span className="text-slate-400">{s.date}</span>
                          <span className="text-slate-500 mx-2">·</span>
                          <span className="text-red-400 font-semibold">{s.timeSlot}</span>
                        </div>
                        <button
                          onClick={() => deleteSlot(s._id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remove block"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── HISTORY ── */}
          {tab === 'history' && (
            <div className="glass-panel rim-light rounded-2xl p-6 border border-white/5 overflow-x-auto">
              <h2 className="text-white font-semibold mb-5">Booking History</h2>
              {history.length === 0 ? (
                <p className="text-slate-500 text-sm py-8 text-center">No history yet.</p>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/8">
                      {['User', 'Hall', 'Date', 'Slot', 'Status'].map(h => (
                        <th key={h} className="py-3 px-4 text-left text-[10px] uppercase tracking-widest text-slate-500 font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(b => (
                      <tr key={b._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="text-white text-sm font-medium">{b.userId?.name}</p>
                          <p className="text-slate-500 text-xs">{b.userId?.email}</p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 text-sm">{b.hallId?.name}</td>
                        <td className="py-3.5 px-4 text-slate-300 text-sm">{b.slotId?.date}</td>
                        <td className="py-3.5 px-4 text-primary font-semibold text-sm">{b.slotId?.timeSlot}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                            b.status === 'Approved' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
                            b.status === 'Rejected' ? 'bg-red-500/15 text-red-400 border-red-500/25' :
                            'bg-amber-500/15 text-amber-400 border-amber-500/25'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
