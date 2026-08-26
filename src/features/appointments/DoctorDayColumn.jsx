import { Tooltip, Empty } from 'antd'
import { buildDaySlots, ROW_H, HEADER_H } from './slots.js'
import { formatCurrency } from '../../utils/format.js'
import { BRAND } from '../../app/theme.js'

const CELL = {
  available: { background: '#FFFFFF', border: '1px solid #D7E0DC', cursor: 'pointer' },
  break: {
    background: '#DADFE1',
    border: '1px solid #CBD1D3',
    color: '#5A6169',
    cursor: 'not-allowed',
  },
  booked: {
    background: 'rgba(34,158,102,0.16)',
    border: '1px solid #37A06E',
    color: '#1F7A4D',
    cursor: 'not-allowed',
  },
  past: { background: '#FFFFFF', border: '1px solid #E7ECEA', color: '#C2CAC7', cursor: 'not-allowed', opacity: 0.6 },
  off: { background: '#F6F8F7', border: '1px solid #EEF2F0', cursor: 'not-allowed' },
}

function Cell({ slot, onPick }) {
  const base = {
    height: ROW_H - 6,
    margin: '3px 6px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    <div
      style={{
        flex: '0 0 168px',
        width: 168,
        border: `1px solid ${BRAND.border}`,
        borderRadius: 12,
        background: '#fff',
        overflow: 'hidden',
      }}
    >
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
        <div style={{ fontSize: 11, color: '#7C8B87', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
          {slots.map((s) => (
            <Cell key={s.start} slot={s} onPick={onPick} />
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
