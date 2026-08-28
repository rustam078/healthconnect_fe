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

// A proportional band (minutes from the grid's 8 AM start), clamped to the grid.
// Used for breaks and for booked appointments so mid-hour spans fill only their
// real minutes instead of whole hour slots. Returns null if fully off-grid.
export function bandFromTimes(startTime, endTime) {
  const s0 = toMin(startTime)
  const e0 = toMin(endTime)
  if (s0 == null || e0 == null) return null
  const s = Math.max(s0, DAY_START * 60)
  const e = Math.min(e0, DAY_END * 60)
  if (e <= s) return null
  return { topMin: s - DAY_START * 60, durMin: e - s }
}

// The first time you can actually book inside an hour slot.
//
// An hour that has already started is still bookable for the minutes left in it, but
// booking it from the top of the hour would send a start time in the past. So on today's
// running hour we begin at the next 5-minute mark instead.
export function firstBookableStart(slotStart, date) {
  const now = dayjs()
  if (!date.isSame(now, 'day')) return slotStart
  const nowMin = now.hour() * 60 + now.minute()
  const s = toMin(slotStart)
  if (s >= nowMin) return slotStart
  return fmt(Math.min(Math.ceil((nowMin + 1) / 5) * 5, s + 60))
}

// Returns { slots, breakBand, elapsedBand } or null (caller shows the "not available"
// state). Each hour slot status: off = outside working hours, past = time gone today,
// available = bookable (white). Break, booked appointments and the elapsed part of the
// current hour are drawn as proportional bands (see bandFromTimes), not per-hour statuses.
export function buildDaySlots(avail, date) {
  if (!avail) return null

  const workStart = toMin(avail.startTime)
  const workEnd = toMin(avail.endTime)

  const now = dayjs()
  const isToday = date.isSame(now, 'day')
  const isPastDay = date.isBefore(now, 'day')
  const nowMin = now.hour() * 60 + now.minute()

  const slots = HOURS.map((h) => {
    const s = h * 60
    const e = s + 60
    const start = fmt(s)
    let status
    if (workStart == null || e <= workStart || s >= workEnd) status = 'off'
    // Compared against the slot's END, not its start: an hour is only gone once it is
    // over. Writing off the whole 3-4 block the moment the clock struck 3 threw away
    // fifty-two bookable minutes. The part that HAS elapsed is shaded by elapsedBand.
    else if (isPastDay || (isToday && e <= nowMin)) status = 'past'
    else status = 'available'
    return { start, end: fmt(e), status }
  })

  const breakBand = bandFromTimes(avail.breakStartTime, avail.breakEndTime)
  if (breakBand) {
    breakBand.label = `${fmt12(avail.breakStartTime.slice(0, 5))} – ${fmt12(avail.breakEndTime.slice(0, 5))}`
  }

  // The minutes of the current hour that have already gone. Shaded the same grey as a
  // finished hour, so at 3:08 the 3-4 row reads as eight minutes spent and the rest still
  // open, instead of the whole row being written off. Only drawn over an hour that would
  // otherwise be bookable - there is nothing to shade on an hour outside working time.
  const currentHour = slots.find((s) => toMin(s.start) <= nowMin && nowMin < toMin(s.end))
  const elapsedBand =
    isToday && currentHour?.status === 'available'
      ? bandFromTimes(currentHour.start, fmt(nowMin))
      : null

  return { slots, breakBand, elapsedBand }
}

// The stretches of a date when a doctor is free: working hours, minus the break, minus
// every appointment already in the book. Cancelled ones have handed their time back, so
// they block nothing.
//
// Returned in order, e.g. for 8-6 with a 1-2 break and a 9:00-9:45 booking:
//   08:00-09:00, 09:45-13:00, 14:00-18:00
export function buildFreeWindows({ availability, appointments = [] }) {
  if (!availability) return []

  const dayStart = toMin(availability.startTime)
  const dayEnd = toMin(availability.endTime)
  if (dayStart == null || dayEnd == null || dayEnd <= dayStart) return []

  const blocks = []
  const breakStart = toMin(availability.breakStartTime)
  const breakEnd = toMin(availability.breakEndTime)
  if (breakStart != null && breakEnd != null && breakEnd > breakStart) {
    blocks.push({ from: breakStart, to: breakEnd })
  }
  appointments
    .filter((a) => a.status !== 'CANCELLED' && a.startTime && a.endTime)
    .forEach((a) =>
      blocks.push({ from: toMin(a.startTime.slice(0, 5)), to: toMin(a.endTime.slice(0, 5)) }),
    )
  blocks.sort((x, y) => x.from - y.from)

  // Walk the day, taking whatever lies between one block and the next. Sorting first is
  // what lets a single cursor do this: blocks that overlap or sit inside another simply
  // push the cursor further along instead of opening a phantom gap behind it.
  const windows = []
  let cursor = dayStart
  for (const block of blocks) {
    if (block.to <= cursor) continue
    if (block.from > cursor) windows.push({ from: cursor, to: Math.min(block.from, dayEnd) })
    cursor = Math.max(cursor, block.to)
    if (cursor >= dayEnd) break
  }
  if (cursor < dayEnd) windows.push({ from: cursor, to: dayEnd })

  return windows.filter((w) => w.to > w.from)
}

// The doctor's whole working day, in order: the stretches you can book, and the stretches
// you cannot, with the reason.
//
// Showing what is taken rather than quietly leaving it out is the point. A list that jumps
// from 8:30 to 9:45 makes you wonder whether the gap is a bug; a list that says "9 - 9:45,
// booked" answers the question and shows how busy the day is.
//
// Free stretches are cut into slots from their own start, not from a grid pinned to the top
// of the day - that is what makes the minutes after an appointment usable, offering 9:45
// rather than skipping to 10:00.
export function buildDaySegments({ availability, appointments = [], date, durationMinutes }) {
  if (!availability || !date || !durationMinutes) return []

  const dayStart = toMin(availability.startTime)
  const dayEnd = toMin(availability.endTime)
  if (dayStart == null || dayEnd == null || dayEnd <= dayStart) return []

  const blocks = []
  const breakStart = toMin(availability.breakStartTime)
  const breakEnd = toMin(availability.breakEndTime)
  if (breakStart != null && breakEnd != null && breakEnd > breakStart) {
    blocks.push({ kind: 'break', from: breakStart, to: breakEnd })
  }
  appointments
    .filter((a) => a.status !== 'CANCELLED' && a.startTime && a.endTime)
    .forEach((a) =>
      blocks.push({
        kind: 'booked',
        from: toMin(a.startTime.slice(0, 5)),
        to: toMin(a.endTime.slice(0, 5)),
        status: a.status,
        patientId: a.patientId,
      }),
    )
  blocks.sort((x, y) => x.from - y.from)

  const now = dayjs()
  const isToday = date.isSame(now, 'day')
  const nowMin = now.hour() * 60 + now.minute()

  const segments = []
  const range = (from, to) => `${fmt12(fmt(from))} – ${fmt12(fmt(to))}`

  const pushFree = (from, to) => {
    if (to <= from) return
    const slots = []
    for (let s = from; s + durationMinutes <= to; s += durationMinutes) {
      // A slot whose time has passed still shows, greyed: seeing that the morning is gone
      // is more use than a stretch that silently starts at lunchtime.
      slots.push({ start: fmt(s), label: fmt12(fmt(s)), past: isToday && s < nowMin })
    }
    segments.push({ kind: 'free', from: fmt(from), range: range(from, to), slots })
  }

  // Sorting first is what lets a single cursor do this: blocks that overlap or nest simply
  // push the cursor along instead of opening a phantom gap behind it.
  let cursor = dayStart
  for (const block of blocks) {
    const from = Math.max(block.from, cursor)
    const to = Math.min(block.to, dayEnd)
    if (to <= from) continue
    if (from > cursor) pushFree(cursor, from)
    segments.push({ ...block, from: fmt(from), range: range(from, to) })
    cursor = to
    if (cursor >= dayEnd) break
  }
  if (cursor < dayEnd) pushFree(cursor, dayEnd)

  return segments
}
