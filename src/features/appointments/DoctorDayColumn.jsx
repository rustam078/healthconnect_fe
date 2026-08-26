import { Tooltip, Empty } from 'antd'
import { generateSlots, fmt12 } from './slots.js'
import { formatCurrency } from '../../utils/format.js'
import { BRAND } from '../../app/theme.js'

const SLOT_STYLE = {
  available: {
    background: 'rgba(34, 158, 102, 0.12)',
    border: '1px solid #37A06E',
    color: '#1F7A4D',
    cursor: 'pointer',
  },
  break: {
    background:
      'repeating-linear-gradient(45deg, #C2C7CC, #C2C7CC 6px, #D6DBE0 6px, #D6DBE0 12px)',
    border: '1px solid #C2C7CC',
    color: '#5A6169',
    boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.25)',
    cursor: 'not-allowed',
  },
  past: {
    background: '#F1F3F2',
    border: '1px solid #E4E8E6',
    color: '#AEB6B3',
    cursor: 'not-allowed',
    textDecoration: 'line-through',
  },
}

function SlotChip({ slot, onPick }) {
  const style = {
    padding: '6px 8px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    textAlign: 'center',
    userSelect: 'none',
    ...SLOT_STYLE[slot.status],
  }
  if (slot.status === 'available') {
    return (
      <div style={style} onClick={() => onPick(slot)}>
        {fmt12(slot.start)}
      </div>
    )
  }
  const tip = slot.status === 'break' ? 'Break — not bookable' : 'Time already passed'
  return (
    <Tooltip title={tip}>
      <div style={style}>{slot.status === 'break' ? 'Break' : fmt12(slot.start)}</div>
    </Tooltip>
  )
}

export default function DoctorDayColumn({ doctor, availability, date, loading, onPick }) {
  const slots = generateSlots(availability, date)
  const openCount = slots.filter((s) => s.status === 'available').length

  return (
    <div
      style={{
        flex: '0 0 190px',
        width: 190,
        border: `1px solid ${BRAND.border}`,
        borderRadius: 12,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 12px 10px',
          borderBottom: `1px solid ${BRAND.border}`,
          background: '#FAFCFB',
        }}
      >
        <div style={{ fontWeight: 600, color: BRAND.heading, lineHeight: 1.2 }}>
          {[doctor.firstName, doctor.lastName].filter(Boolean).join(' ')}
        </div>
        <div style={{ fontSize: 11, color: '#7C8B87', marginTop: 2 }}>
          {doctor.qualification}
        </div>
        <div style={{ fontSize: 11, color: BRAND.primary, marginTop: 2 }}>
          {formatCurrency(doctor.consultationFee)}
          {openCount > 0 && (
            <span style={{ color: '#7C8B87' }}> · {openCount} open</span>
          )}
        </div>
      </div>

      <div
        style={{
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          maxHeight: 460,
          overflowY: 'auto',
        }}
      >
        {loading ? (
          <div style={{ fontSize: 12, color: '#9AA7A3', textAlign: 'center', padding: 16 }}>
            Loading…
          </div>
        ) : slots.length ? (
          slots.map((s) => <SlotChip key={s.start} slot={s} onPick={onPick} />)
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Not available"
            style={{ margin: '16px 0' }}
          />
        )}
      </div>
    </div>
  )
}
