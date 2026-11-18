import { useState,useEffect } from 'react'
import { DatePicker, Select, Space, Card, Button, Empty, Spin, Alert, Typography, Drawer, Input, App } from 'antd'
import dayjs from 'dayjs'
import { useSpecialties, useAvailableDoctors, useBookAppointment } from './customerPortalHooks.js'
import { getErrorMessage } from '../../../utils/apiError.js'

const DATE_FORMAT = 'YYYY-MM-DD'
const fmt = (t) => (dayjs(`2000-01-01T${t}`).isValid() ? dayjs(`2000-01-01T${t}`).format('hh:mm A') : t)

// Availability-first booking: pick date + specialty, see each doctor's slots (free = clickable,
// occupied = red), then book an open slot with a mandatory reason. Others' details are hidden.
export default function FindDoctorTab() {
  const { message } = App.useApp()
  const [date, setDate] = useState(dayjs())
  const [specialtyId, setSpecialtyId] = useState(null)
  const [booking, setBooking] = useState(null) // { doctor, time }
  const [reason, setReason] = useState('')

  const specialties = useSpecialties()
  const dateStr = date ? date.format(DATE_FORMAT) : null
  const doctors = useAvailableDoctors({ specialtyId, date: dateStr })
  const bookMut = useBookAppointment()

  const openBook = (doctor, time) => { setBooking({ doctor, time }); setReason('') }

  const confirmBook = () => {
    if (!reason.trim()) return message.error('Please enter a reason for the appointment')
    bookMut.mutateAsync({ doctorId: booking.doctor.doctorId, date: dateStr, startTime: booking.time, reason: reason.trim() })
      .then(() => { message.success('Appointment booked'); setBooking(null) })
      .catch((e) => message.error(getErrorMessage(e)))
  }

  const slotCells = (doctor) => {
    const cells = [
      ...(doctor.slots ?? []).map((s) => ({ time: s, occupied: false })),
      ...(doctor.occupiedSlots ?? []).map((s) => ({ time: s, occupied: true })),
    ].sort((a, b) => String(a.time).localeCompare(String(b.time)))
    return (
      <Space wrap>
        {cells.map((c) => (c.occupied ? (
          <Button key={`o${c.time}`} size="small" disabled danger style={{ opacity: 0.85 }}>{fmt(c.time)}</Button>
        ) : (
          <Button key={c.time} size="small" type="default" onClick={() => openBook(doctor, c.time)}>{fmt(c.time)}</Button>
        )))}
      </Space>
    )
  }
      useEffect(() => {
        const list = specialties.data ?? [];

        if (list.length > 0 && specialtyId == null) {
          setSpecialtyId(list[0].id);
        }
      }, [specialties.data, specialtyId]);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space wrap>
        <DatePicker value={date} format={DATE_FORMAT} onChange={setDate}
          disabledDate={(d) => d && d < dayjs().startOf('day')} />
<Select
  placeholder="Select a specialty"
  style={{ width: 240 }}
  loading={specialties.isLoading}
  showSearch
  filterOption={(input, option) =>
    option?.label?.toLowerCase().includes(input.toLowerCase())
  }
  autoClearSearchValue
  onSelect={() => {
    document.activeElement?.blur();
  }}
  value={specialtyId}
  onChange={setSpecialtyId}
  options={(specialties.data ?? []).map((s) => ({
    value: s.id,
    label: s.name,
  }))}
/>
        <Typography.Text type="secondary">
          <span style={{ color: '#52c41a' }}>■</span> open &nbsp; <span style={{ color: '#ff4d4f' }}>■</span> occupied
        </Typography.Text>
      </Space>

      {!specialtyId || !dateStr ? (
        <Typography.Text type="secondary">Pick a date and a specialty to see doctors.</Typography.Text>
      ) : doctors.isLoading ? (
        <Spin />
      ) : doctors.isError ? (
        <Alert type="error" message={getErrorMessage(doctors.error)} />
      ) : (doctors.data ?? []).length === 0 ? (
          <Empty
            description={
              <span style={{ color: '#D97706', fontWeight: 500 }}>
                No doctors are available for the selected date and time.
                Please try another date to find available doctors.
              </span>
            }
          />
      ) : (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {doctors.data.map((doctor) => (
            <Card key={doctor.doctorId} size="small" title={doctor.name}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Typography.Text type="secondary">{doctor.qualification} · Fee: {doctor.consultationFee}</Typography.Text>
                {slotCells(doctor)}
              </Space>
            </Card>
          ))}
        </Space>
      )}

      <Drawer title="Book appointment" placement="right" width={420} open={booking != null}
        onClose={() => setBooking(null)} destroyOnHidden
        extra={<Button type="primary" loading={bookMut.isPending} onClick={confirmBook}>Book</Button>}>
        {booking && (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Typography.Text><b>Doctor:</b> {booking.doctor.name}</Typography.Text>
            <Typography.Text><b>Date:</b> {dayjs(dateStr).format('DD MMM YYYY')}</Typography.Text>
            <Typography.Text><b>Time:</b> {fmt(booking.time)}</Typography.Text>
            <div>
              <Typography.Text type="danger">*</Typography.Text> <Typography.Text strong>Reason for appointment</Typography.Text>
              <Input.TextArea rows={4} value={reason} onChange={(e) => setReason(e.target.value)}
                maxLength={500} showCount placeholder="Describe the reason / symptoms..." style={{ marginTop: 6 }} />
            </div>
          </Space>
        )}
      </Drawer>
    </Space>
  )
}
