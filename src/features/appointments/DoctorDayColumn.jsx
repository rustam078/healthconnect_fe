import { Tooltip, Empty } from 'antd'
import { buildDaySlots, bandFromTimes, fmt12, ROW_H, HEADER_H } from './slots.js'
import { formatCurrency } from '../../utils/format.js'
import { BRAND } from '../../app/theme.js'

const CELL = {
  available: { background: '#FFFFFF', cursor: 'pointer' },
  past: { background: '#E9ECEE', color: '#98A2A6', cursor: 'not-allowed' }, // gray = passed
  off: {
    // hatched neutral = outside working hours
    background: 'repeating-linear-gradient(45deg,#F2F5F4,#F2F5F4 5px,#E8EDEB 5px,#E8EDEB 10px)',
    cursor: 'not-allowed',
  },
}

function endOf(appt) {
  if (appt.endTime) return appt.endTime
  const [h, m] = appt.startTime.split(':').map(Number)
  const tot = h * 60 + m + (appt.durationMinutes || 0)
  return `${String(Math.floor(tot / 60)).padStart(2, '0')}:${String(tot % 60).padStart(2, '0')}`
}

function Cell({ slot, onPick, last }) {
  const base = {
    height: ROW_H,
    borderBottom: last ? 'none' : '1px solid #EDF1EF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 600,
    userSelect: 'none',
    ...CELL[slot.status],
  }
  if (slot.status === 'available') {
    return (
      <div className="appt-open" style={base} onClick={() => onPick(slot)}>
        <span className="appt-open-hint">Book</span>
      </div>
    )
  }
  const tip = slot.status === 'past' ? 'Time already passed' : 'Outside working hours'
  return (
    <Tooltip title={tip}>
      <div style={base} />
    </Tooltip>
  )
}

export default function DoctorDayColumn({
  doctor,
  availability,
  date,
  loading,
  appointments = [],
  onPick,
  onPickAppointment,
}) {
  const day = buildDaySlots(availability, date)

  return (
    <div style={{ flex: '0 0 150px', width: 150, borderRight: `1px solid ${BRAND.border}` }}>
      <div
        style={{
          height: HEADER_H,
          padding: '10px 12px',
          borderBottom: `1px solid ${BRAND.border}`,
          background: '#FAFCFB',
          overflow: 'hidden',
        }}
      >
        <div style={{ fontWeight: 600, color: BRAND.heading, lineHeight: 1.2, fontSize: 13 }}>
          {[doctor.firstName, doctor.lastName].filter(Boolean).join(' ')}
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#7C8B87',
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {doctor.qualification}
        </div>
        <div style={{ fontSize: 11, color: BRAND.primary, marginTop: 1 }}>
          {formatCurrency(doctor.consultationFee)}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 16, fontSize: 12, color: '#9AA7A3', textAlign: 'center' }}>Loading…</div>
      ) : day ? (
        <div style={{ position: 'relative' }}>
          {day.slots.map((s, i) => (
            <Cell key={s.start} slot={s} onPick={onPick} last={i === day.slots.length - 1} />
          ))}
          {day.breakBand && (
            <Tooltip title={`Break — ${day.breakBand.label}`}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: (day.breakBand.topMin / 60) * ROW_H,
                  height: (day.breakBand.durMin / 60) * ROW_H,
                  background: '#FBEAC6',
                  borderTop: '1px solid #E9CE93',
                  borderBottom: '1px solid #E9CE93',
                  color: '#8A6A1E',
                  fontSize: 11,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'not-allowed',
                  zIndex: 2,
                }}
              >
                Break
              </div>
            </Tooltip>
          )}

          {appointments.map((appt) => {
            const band = bandFromTimes(appt.startTime, endOf(appt))
            if (!band) return null
            const range = `${fmt12(appt.startTime.slice(0, 5))} – ${fmt12(endOf(appt).slice(0, 5))}`
            return (
              <Tooltip key={appt.id} title={`Booked — ${range}`}>
                <div
                  onClick={() => onPickAppointment(appt)}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: (band.topMin / 60) * ROW_H,
                    height: (band.durMin / 60) * ROW_H,
                    background: 'rgba(34,158,102,0.20)',
                    borderTop: '1px solid #37A06E',
                    borderBottom: '1px solid #37A06E',
                    borderLeft: '3px solid #2E8B5E',
                    color: '#1F7A4D',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 3,
                  }}
                >
                  Booked
                </div>
              </Tooltip>
            )
          })}
        </div>
      ) : (
        <div style={{ padding: '28px 8px' }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Not available" style={{ margin: 0 }} />
        </div>
      )}
    </div>
  )
}
