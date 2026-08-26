import { Tooltip, Empty } from 'antd'
import { buildDaySlots, ROW_H, HEADER_H } from './slots.js'
import { formatCurrency } from '../../utils/format.js'
import { BRAND } from '../../app/theme.js'

const CELL = {
  available: { background: '#FFFFFF', cursor: 'pointer' },
  break: { background: '#FBEAC6', color: '#8A6A1E', cursor: 'not-allowed' }, // amber = on break
  booked: { background: 'rgba(34,158,102,0.18)', color: '#1F7A4D', cursor: 'not-allowed' }, // green = booked
  past: { background: '#E9ECEE', color: '#98A2A6', cursor: 'not-allowed' }, // gray = passed
  off: {
    // hatched neutral = outside working hours
    background: 'repeating-linear-gradient(45deg,#F2F5F4,#F2F5F4 5px,#E8EDEB 5px,#E8EDEB 10px)',
    cursor: 'not-allowed',
  },
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
  const label = slot.status === 'break' ? 'Break' : slot.status === 'booked' ? 'Booked' : ''
  const tip =
    slot.status === 'break'
      ? 'Break — not bookable'
      : slot.status === 'booked'
        ? 'Already booked'
        : slot.status === 'past'
          ? 'Time already passed'
          : 'Outside working hours'
  return (
    <Tooltip title={tip}>
      <div style={base}>{label}</div>
    </Tooltip>
  )
}

export default function DoctorDayColumn({ doctor, availability, date, loading, onPick }) {
  const slots = buildDaySlots(availability, date)

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
      ) : slots ? (
        <div>
          {slots.map((s, i) => (
            <Cell key={s.start} slot={s} onPick={onPick} last={i === slots.length - 1} />
          ))}
        </div>
      ) : (
        <div style={{ padding: '28px 8px' }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Not available" style={{ margin: 0 }} />
        </div>
      )}
    </div>
  )
}
