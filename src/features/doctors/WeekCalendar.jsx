import { Empty } from 'antd'
import { BRAND } from '../../app/theme.js'

const HOUR_H = 46 // pixels per hour

const DAYS = [
  { key: 'MONDAY', label: 'Mon' },
  { key: 'TUESDAY', label: 'Tue' },
  { key: 'WEDNESDAY', label: 'Wed' },
  { key: 'THURSDAY', label: 'Thu' },
  { key: 'FRIDAY', label: 'Fri' },
  { key: 'SATURDAY', label: 'Sat' },
  { key: 'SUNDAY', label: 'Sun' },
]

const JS_DOW = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

function toMin(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function fmt12(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  const ap = h < 12 ? 'AM' : 'PM'
  const hh = ((h + 11) % 12) + 1
  return m ? `${hh}:${String(m).padStart(2, '0')} ${ap}` : `${hh} ${ap}`
}

export default function WeekCalendar({ availability = [] }) {
  const byDay = Object.fromEntries(availability.map((a) => [a.dayOfWeek, a]))
  const today = JS_DOW[new Date().getDay()]

  if (!availability.length) {
    return (
      <Empty
        description="No availability set for this doctor yet."
        style={{ padding: '32px 0' }}
      />
    )
  }

  const bounds = availability.flatMap((a) => [toMin(a.startTime), toMin(a.endTime)]).filter((v) => v != null)
  const minH = bounds.length ? Math.max(0, Math.floor(Math.min(...bounds) / 60)) : 8
  const maxH = bounds.length ? Math.min(24, Math.ceil(Math.max(...bounds) / 60)) : 20
  const totalH = (maxH - minH) * HOUR_H
  const hours = Array.from({ length: maxH - minH + 1 }, (_, i) => minH + i)

  const y = (min) => ((min - minH * 60) / 60) * HOUR_H

  const gridLines = `repeating-linear-gradient(to bottom, transparent, transparent ${HOUR_H - 1}px, #EEF2F0 ${HOUR_H - 1}px, #EEF2F0 ${HOUR_H}px)`

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 760 }}>
        {/* Day header row */}
        <div style={{ display: 'grid', gridTemplateColumns: `56px repeat(7, minmax(92px, 1fr))` }}>
          <div />
          {DAYS.map((d) => {
            const isToday = d.key === today
            return (
              <div
                key={d.key}
                style={{
                  textAlign: 'center',
                  padding: '8px 0',
                  fontWeight: 600,
                  fontSize: 13,
                  color: isToday ? '#fff' : BRAND.heading,
                  background: isToday ? BRAND.primary : 'transparent',
                  borderRadius: 8,
                  margin: '0 3px',
                }}
              >
                {d.label}
              </div>
            )
          })}
        </div>

        {/* Body: time gutter + 7 day columns */}
        <div style={{ display: 'flex', marginTop: 4 }}>
          <div style={{ width: 56, position: 'relative', height: totalH }}>
            {hours.map((h) => (
              <div
                key={h}
                style={{
                  position: 'absolute',
                  top: y(h * 60),
                  right: 8,
                  transform: 'translateY(-50%)',
                  fontSize: 11,
                  color: '#8A9793',
                  whiteSpace: 'nowrap',
                }}
              >
                {fmt12(h * 60)}
              </div>
            ))}
          </div>

          {DAYS.map((d) => {
            const a = byDay[d.key]
            const isToday = d.key === today
            return (
              <div
                key={d.key}
                style={{
                  flex: 1,
                  minWidth: 92,
                  position: 'relative',
                  height: totalH,
                  margin: '0 3px',
                  borderRadius: 8,
                  border: `1px solid ${isToday ? 'rgba(15,118,110,0.35)' : '#EDF1EF'}`,
                  background: isToday ? `${gridLines}, rgba(15,118,110,0.03)` : gridLines,
                }}
              >
                {a && (
                  <div
                    style={{
                      position: 'absolute',
                      top: y(toMin(a.startTime)) + 1,
                      height: y(toMin(a.endTime)) - y(toMin(a.startTime)) - 2,
                      left: 4,
                      right: 4,
                      background: 'rgba(15,118,110,0.13)',
                      borderLeft: `3px solid ${BRAND.primary}`,
                      borderRadius: 6,
                      padding: '4px 6px',
                      overflow: 'hidden',
                      zIndex: 1,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: BRAND.heading, lineHeight: 1.25 }}>
                      {fmt12(toMin(a.startTime))}
                    </div>
                    <div style={{ fontSize: 10, color: '#5C6B67' }}>
                      – {fmt12(toMin(a.endTime))}
                    </div>
                  </div>
                )}

                {a && a.breakStartTime && a.breakEndTime && (
                  <div
                    title={`Break ${fmt12(toMin(a.breakStartTime))} – ${fmt12(toMin(a.breakEndTime))}`}
                    style={{
                      position: 'absolute',
                      top: y(toMin(a.breakStartTime)),
                      height: Math.max(14, y(toMin(a.breakEndTime)) - y(toMin(a.breakStartTime))),
                      left: 4,
                      right: 4,
                      borderRadius: 6,
                      background:
                        'repeating-linear-gradient(45deg, #C2C7CC, #C2C7CC 6px, #D6DBE0 6px, #D6DBE0 12px)',
                      boxShadow: 'inset 0 1px 5px rgba(0,0,0,0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#4C545B', letterSpacing: 0.3 }}>
                      Break
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 12, color: '#5C6B67' }}>
          <LegendSwatch
            label="Working hours"
            style={{ background: 'rgba(15,118,110,0.13)', borderLeft: `3px solid ${BRAND.primary}` }}
          />
          <LegendSwatch
            label="Break"
            style={{
              background: 'repeating-linear-gradient(45deg, #C2C7CC, #C2C7CC 6px, #D6DBE0 6px, #D6DBE0 12px)',
              boxShadow: 'inset 0 1px 5px rgba(0,0,0,0.35)',
            }}
          />
        </div>
      </div>
    </div>
  )
}

function LegendSwatch({ label, style }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 22, height: 14, borderRadius: 4, ...style }} />
      {label}
    </span>
  )
}
