import dayjs from 'dayjs'

const JS_DOW = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

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
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`
}

// Build fixed-length slots for a doctor's availability on a given date.
// status: 'available' | 'break' | 'past'
export function generateSlots(avail, date, slotMinutes = 30) {
  if (!avail) return []
  const start = toMin(avail.startTime)
  const end = toMin(avail.endTime)
  if (start == null || end == null || end <= start) return []

  const bStart = toMin(avail.breakStartTime)
  const bEnd = toMin(avail.breakEndTime)

  const now = dayjs()
  const isToday = date.isSame(now, 'day')
  const isPastDay = date.isBefore(now, 'day')
  const nowMin = now.hour() * 60 + now.minute()

  const slots = []
  for (let s = start; s + slotMinutes <= end; s += slotMinutes) {
    const e = s + slotMinutes
    const inBreak = bStart != null && bEnd != null && s < bEnd && e > bStart
    let status = 'available'
    if (inBreak) status = 'break'
    else if (isPastDay || (isToday && s < nowMin)) status = 'past'
    slots.push({ start: fmt(s), end: fmt(e), status })
  }
  return slots
}
