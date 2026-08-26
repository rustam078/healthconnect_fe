import { useState, useEffect } from 'react'
import { Modal, Switch, TimePicker, Space, Typography, App } from 'antd'
import dayjs from 'dayjs'
import { useSyncAvailability } from './doctorDetailHooks.js'
import { getErrorMessage } from '../../utils/apiError.js'

const DAYS = [
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
  { key: 'SATURDAY', label: 'Saturday' },
  { key: 'SUNDAY', label: 'Sunday' },
]

const parse = (t) => (t ? dayjs(`2000-01-01T${t}`) : null)
const EMPTY = () =>
  Object.fromEntries(
    DAYS.map((d) => [d.key, { enabled: false, start: null, end: null, breakStart: null, breakEnd: null }]),
  )

function buildRows(availability) {
  const rows = EMPTY()
  availability.forEach((a) => {
    rows[a.dayOfWeek] = {
      enabled: true,
      start: parse(a.startTime),
      end: parse(a.endTime),
      breakStart: parse(a.breakStartTime),
      breakEnd: parse(a.breakEndTime),
    }
  })
  return rows
}

export default function AvailabilityEditorModal({ open, doctorId, availability, onClose }) {
  const { message } = App.useApp()
  const [rows, setRows] = useState(EMPTY)
  const sync = useSyncAvailability(doctorId)

  useEffect(() => {
    if (open) setRows(buildRows(availability || []))
  }, [open, availability])

  const set = (day, patch) => setRows((r) => ({ ...r, [day]: { ...r[day], ...patch } }))

  const handleOk = () => {
    const upsert = []
    const enabledDays = []

    for (const d of DAYS) {
      const r = rows[d.key]
      if (!r.enabled) continue
      if (!r.start || !r.end) {
        return message.error(`${d.label}: start and end time are required`)
      }
      if (!r.start.isBefore(r.end)) {
        return message.error(`${d.label}: start must be before end`)
      }
      if (r.end.diff(r.start, 'minute') > 600) {
        return message.error(`${d.label}: availability cannot exceed 10 hours`)
      }
      if (r.breakStart || r.breakEnd) {
        if (!r.breakStart || !r.breakEnd) {
          return message.error(`${d.label}: set both break start and end (or neither)`)
        }
        if (!r.breakStart.isBefore(r.breakEnd)) {
          return message.error(`${d.label}: break start must be before break end`)
        }
        if (r.breakStart.isBefore(r.start) || r.breakEnd.isAfter(r.end)) {
          return message.error(`${d.label}: break must fall within working hours`)
        }
      }
      enabledDays.push(d.key)
      upsert.push({
        dayOfWeek: d.key,
        startTime: r.start.format('HH:mm'),
        endTime: r.end.format('HH:mm'),
        breakStartTime: r.breakStart ? r.breakStart.format('HH:mm') : null,
        breakEndTime: r.breakEnd ? r.breakEnd.format('HH:mm') : null,
      })
    }

    const deleteIds = (availability || [])
      .filter((a) => !enabledDays.includes(a.dayOfWeek))
      .map((a) => a.id)

    sync.mutate(
      { upsert, deleteIds },
      {
        onSuccess: () => {
          message.success('Availability updated')
          onClose()
        },
        onError: (e) => message.error(getErrorMessage(e)),
      },
    )
  }

  return (
    <Modal
      open={open}
      width={720}
      title="Edit Weekly Availability"
      okText="Save"
      confirmLoading={sync.isPending}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnHidden
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <div style={{ display: 'flex', fontSize: 12, color: '#8A9793', paddingLeft: 4 }}>
          <span style={{ width: 150 }}>Day</span>
          <span style={{ width: 210 }}>Working hours</span>
          <span>Break (optional)</span>
        </div>
        {DAYS.map((d) => {
          const r = rows[d.key]
          return (
            <div
              key={d.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 4px',
                borderTop: '1px solid #F0F3F2',
                opacity: r.enabled ? 1 : 0.55,
              }}
            >
              <div style={{ width: 150, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Switch
                  size="small"
                  checked={r.enabled}
                  onChange={(v) => set(d.key, { enabled: v })}
                />
                <Typography.Text strong>{d.label}</Typography.Text>
              </div>
              <div style={{ width: 210 }}>
                <TimePicker
                  format="HH:mm"
                  minuteStep={15}
                  disabled={!r.enabled}
                  value={r.start}
                  onChange={(v) => set(d.key, { start: v })}
                  placeholder="Start"
                  style={{ width: 95 }}
                />
                <TimePicker
                  format="HH:mm"
                  minuteStep={15}
                  disabled={!r.enabled}
                  value={r.end}
                  onChange={(v) => set(d.key, { end: v })}
                  placeholder="End"
                  style={{ width: 95, marginLeft: 8 }}
                />
              </div>
              <Space>
                <TimePicker
                  format="HH:mm"
                  minuteStep={15}
                  disabled={!r.enabled}
                  value={r.breakStart}
                  onChange={(v) => set(d.key, { breakStart: v })}
                  placeholder="Break start"
                  style={{ width: 110 }}
                />
                <TimePicker
                  format="HH:mm"
                  minuteStep={15}
                  disabled={!r.enabled}
                  value={r.breakEnd}
                  onChange={(v) => set(d.key, { breakEnd: v })}
                  placeholder="Break end"
                  style={{ width: 110 }}
                />
              </Space>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
