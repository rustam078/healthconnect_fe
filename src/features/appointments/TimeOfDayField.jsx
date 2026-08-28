import { Select, Segmented, Space } from 'antd'
import dayjs from 'dayjs'

// Hours read 1-12, in that order. Antd's own picker leads with 12, which is right on a
// clock face and wrong in a form: nobody scanning for "2 o'clock" expects to start at 12.
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)

const MERIDIEM = ['AM', 'PM']

// A time of day as three boxes: hour, minute, AM/PM.
//
// Replaces antd's TimePicker for appointments. That control needs a dropdown panel, three
// scrolling columns and a confirm, and it still showed the time as one string you had to
// parse. Here every part is its own box, so "2 PM" is two clicks and there is no way to
// mistake the half of the day.
//
// Talks dayjs, like every other date field in the app, so `value.format('HH:mm')` at submit
// keeps sending 24-hour times to the backend. Shaped for antd Form: it takes `value` and
// calls `onChange`, so a Form.Item wires it up with no extra plumbing.
export default function TimeOfDayField({ value, onChange, minuteStep = 15, disabled }) {
  const minutes = Array.from({ length: 60 / minuteStep }, (_, i) => i * minuteStep)

  const hour24 = value ? value.hour() : null
  const hour12 = hour24 == null ? null : ((hour24 + 11) % 12) + 1
  const minute = value ? value.minute() : null
  const meridiem = hour24 == null ? 'AM' : hour24 < 12 ? 'AM' : 'PM'

  // Rebuilding from parts rather than mutating: a half-filled field has no time yet, so
  // the missing parts fall back to the top of the hour, in the morning.
  const emit = (parts) => {
    const h12 = parts.hour12 ?? hour12 ?? 12
    const m = parts.minute ?? minute ?? 0
    const ap = parts.meridiem ?? meridiem
    const h24 = ap === 'PM' ? (h12 % 12) + 12 : h12 % 12
    onChange?.(dayjs().hour(h24).minute(m).second(0).millisecond(0))
  }

  const boxStyle = { width: 78 }

  return (
    <Space size={6} align="center">
      <Select
        value={hour12}
        onChange={(h) => emit({ hour12: h })}
        disabled={disabled}
        placeholder="HH"
        style={boxStyle}
        options={HOURS.map((h) => ({ label: String(h).padStart(2, '0'), value: h }))}
      />
      <span style={{ fontWeight: 600, opacity: 0.45 }}>:</span>
      <Select
        value={minute}
        onChange={(m) => emit({ minute: m })}
        disabled={disabled}
        placeholder="MM"
        style={boxStyle}
        options={minutes.map((m) => ({ label: String(m).padStart(2, '0'), value: m }))}
      />
      <Segmented
        value={meridiem}
        onChange={(ap) => emit({ meridiem: ap })}
        disabled={disabled}
        options={MERIDIEM}
      />
    </Space>
  )
}
