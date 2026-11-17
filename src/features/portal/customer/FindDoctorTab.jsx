import { useState } from 'react'
import {
  DatePicker,
  Select,
  Space,
  Card,
  Button,
  Empty,
  Spin,
  Alert,
  Typography,
  App,
} from 'antd'
import dayjs from 'dayjs'
import {
  useSpecialties,
  useAvailableDoctors,
  useBookAppointment,
} from './customerPortalHooks.js'
import { getErrorMessage } from '../../../utils/apiError.js'

const DATE_FORMAT = 'YYYY-MM-DD'

// Lets the patient pick a date + specialty and book a free slot with a chosen doctor.
export default function FindDoctorTab() {
  const { message, modal } = App.useApp()
  const [date, setDate] = useState(dayjs())
  const [specialtyId, setSpecialtyId] = useState(null)

  const specialties = useSpecialties()
  const dateStr = date ? date.format(DATE_FORMAT) : null
  const doctors = useAvailableDoctors({ specialtyId, date: dateStr })
  const booking = useBookAppointment()

  // Confirm, then book the picked doctor + slot.
  const handleSlot = (doctor, startTime) => {
    modal.confirm({
      title: 'Confirm booking',
      content: `Book ${startTime} with ${doctor.name} on ${dateStr}?`,
      okText: 'Book',
      onOk: () =>
        booking
          .mutateAsync({ doctorId: doctor.doctorId, date: dateStr, startTime })
          .then(() => message.success('Appointment booked'))
          .catch((e) => {
            message.error(getErrorMessage(e))
            throw e
          }),
    })
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space wrap>
        <DatePicker
          value={date}
          format={DATE_FORMAT}
          onChange={setDate}
          disabledDate={(d) => d && d < dayjs().startOf('day')}
        />
        <Select
          placeholder="Select a specialty"
          style={{ width: 240 }}
          loading={specialties.isLoading}
          value={specialtyId}
          onChange={setSpecialtyId}
          options={(specialties.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
        />
      </Space>

      {!specialtyId || !dateStr ? (
        <Typography.Text type="secondary">
          Pick a date and a specialty to see available doctors.
        </Typography.Text>
      ) : doctors.isLoading ? (
        <Spin />
      ) : doctors.isError ? (
        <Alert type="error" message={getErrorMessage(doctors.error)} />
      ) : (doctors.data ?? []).length === 0 ? (
        <Empty description="No doctors available for that date — try another date." />
      ) : (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {doctors.data.map((doctor) => (
            <Card key={doctor.doctorId} size="small" title={doctor.name}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Typography.Text type="secondary">
                  {doctor.qualification} · Fee: {doctor.consultationFee}
                </Typography.Text>
                <Space wrap>
                  {(doctor.slots ?? []).map((slot) => (
                    <Button key={slot} size="small" onClick={() => handleSlot(doctor, slot)}>
                      {slot}
                    </Button>
                  ))}
                </Space>
              </Space>
            </Card>
          ))}
        </Space>
      )}
    </Space>
  )
}
