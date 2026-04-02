import { startOfDay, format } from 'date-fns'
import { Calendar } from 'lucide-react'

/**
 * Simple native date picker with consistent styling.
 * Disables past dates and avoids layout issues from custom calendars.
 */
export function DatePicker({ value, onChange, placeholder = 'Select a date' }) {
  const today = startOfDay(new Date())

  return (
    <label className="flex items-center gap-3 w-full md:w-72 px-4 py-3.5 rounded-xl border bg-white/5 border-white/10 hover:border-white/20 text-sm transition-all text-left focus-within:border-primary/50 focus-within:bg-primary/5">
      <Calendar size={16} className="text-slate-500 flex-shrink-0" />
      <input
        type="date"
        min={format(today, 'yyyy-MM-dd')}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent outline-none text-white [color-scheme:dark] placeholder:text-slate-600"
        aria-label={placeholder}
      />
    </label>
  )
}
