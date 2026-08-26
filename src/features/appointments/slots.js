import dayjs from 'dayjs'

const JS_DOW = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

// Fixed calendar grid: 1-hour slots from 8 AM to 6 PM.
export const DAY_START = 8
export const DAY_END = 18
export const HOURS = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i) // [8..17]

// Shared layout constants so the left time axis and doctor columns stay aligned.
export const ROW_H = 46
export const HEADER_H = 68

export function dayOfWeekOf(date) {
  return JS_DOW[date.day()]
}

function toMin(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function fmt(min) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
}

export function fmt12(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const ap = h < 12 ? 'AM' : 'PM'
  const hh = ((h + 11) % 12) + 1
  return m ? `${hh}:${String(m).padStart(2, '0')} ${ap}` : `${hh} ${ap}`
}

export const TIME_LABELS = HOURS.map((h) => fmt12(fmt(h * 60)))

// Returns { slots, breakBand } or null (caller shows the "not available" state).
// Each hour slot status: off = outside working hours, booked = already taken,
// past = time gone today, available = bookable (white).
// The break is NOT a per-hour status — it's a proportional band (in minutes
// from the grid's 8 AM start) so a mid-hour break only fills its real minutes.
export function buildDaySlots(avail, date, bookedStarts = new Set()) {
  if (!avail) return null

  const workStart = toMin(avail.startTime)
  const workEnd = toMin(avail.endTime)
  const bStart = toMin(avail.breakStartTime)
  const bEnd = toMin(avail.breakEndTime)

  const now = dayjs()
  const isToday = date.isSame(now, 'day')
  const isPastDay = date.isBefore(now, 'day')
  const nowMin = now.hour() * 60 + now.minute()

  const gridStart = DAY_START * 60
  const gridEnd = DAY_END * 60

  const slots = HOURS.map((h) => {
    const s = h * 60
    const e = s + 60
    const start = fmt(s)
    let status
    if (workStart == null || e <= workStart || s >= workEnd) status = 'off'
    else if (bookedStarts.has(start)) status = 'booked'
    else if (isPastDay || (isToday && s < nowMin)) status = 'past'
    else status = 'available'
    return { start, end: fmt(e), status }
  })

  let breakBand = null
  if (bStart != null && bEnd != null && bEnd > bStart) {
    const s = Math.max(bStart, gridStart)
    const e = Math.min(bEnd, gridEnd)
    if (e > s) {
      breakBand = { topMin: s - gridStart, durMin: e - s, label: `${fmt12(fmt(bStart))} – ${fmt12(fmt(bEnd))}` }
    }
  }

  return { slots, breakBand }
}
