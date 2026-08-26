import { useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import {
  Card,
  DatePicker,
  Button,
  Space,
  Typography,
  Alert,
  Skeleton,
  Empty,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getDoctors } from '../doctors/doctorsApi.js'
import { getDoctorDetails } from '../doctors/doctorDetailApi.js'
import { dayOfWeekOf } from './slots.js'
import DoctorDayColumn from './DoctorDayColumn.jsx'
import BookAppointmentDrawer from './BookAppointmentDrawer.jsx'
import { getErrorMessage } from '../../utils/apiError.js'
import { BRAND } from '../../app/theme.js'

function LegendDot({ label, style }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5C6B67' }}>
      <span style={{ width: 16, height: 16, borderRadius: 4, ...style }} />
      {label}
    </span>
  )
}

export default function AppointmentsPage() {
  const [date, setDate] = useState(dayjs())
  const [drawer, setDrawer] = useState({ open: false, initial: null })

  const doctorsQuery = useQuery({
    queryKey: ['appt-doctors'],
    queryFn: () => getDoctors({ page: 0, size: 100 }),
  })
  const doctors = doctorsQuery.data?.content ?? []

  const detailsQueries = useQueries({
    queries: doctors.map((d) => ({
      queryKey: ['doctorDetails', d.id],
      queryFn: () => getDoctorDetails(d.id),
    })),
  })

  const weekday = dayOfWeekOf(date)

  const openBook = (partial) =>
    setDrawer({ open: true, initial: { ...partial, key: Date.now() } })

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space
          style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}
          align="start"
          wrap
        >
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Appointments
            </Typography.Title>
            <Typography.Text type="secondary">
              {date.format('dddd, DD MMMM YYYY')}
            </Typography.Text>
          </div>
          <Space wrap>
            <DatePicker
              value={date}
              onChange={(d) => d && setDate(d)}
              allowClear={false}
              format="DD MMM YYYY"
              disabledDate={(d) => d && d < dayjs().startOf('day')}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openBook({ appointmentDate: date })}
            >
              Add appointment
            </Button>
          </Space>
        </Space>

        <Space size={20} wrap style={{ marginBottom: 4 }}>
          <LegendDot
            label="Available"
            style={{ background: 'rgba(34,158,102,0.12)', border: '1px solid #37A06E' }}
          />
          <LegendDot
            label="Break"
            style={{
              background: 'repeating-linear-gradient(45deg,#C2C7CC,#C2C7CC 5px,#D6DBE0 5px,#D6DBE0 10px)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
            }}
          />
          <LegendDot label="Passed" style={{ background: '#F1F3F2', border: '1px solid #E4E8E6' }} />
        </Space>

        <Alert
          type="info"
          showIcon
          style={{ marginTop: 12 }}
          message="Already-booked slots aren't marked yet — the appointment listing API is still in progress. Any open slot can be booked."
        />
      </Card>

      <Card styles={{ body: { paddingBottom: 12 } }}>
        {doctorsQuery.isLoading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : doctorsQuery.isError ? (
          <Typography.Text type="danger">{getErrorMessage(doctorsQuery.error)}</Typography.Text>
        ) : doctors.length === 0 ? (
          <Empty description="No doctors found" />
        ) : (
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
            {doctors.map((d, i) => {
              const details = detailsQueries[i]?.data
              const availability = (details?.availabilityToSave ?? []).find(
                (a) => a.dayOfWeek === weekday,
              )
              return (
                <DoctorDayColumn
                  key={d.id}
                  doctor={d}
                  availability={availability}
                  date={date}
                  loading={detailsQueries[i]?.isLoading}
                  onPick={(slot) =>
                    openBook({
                      doctorId: d.id,
                      appointmentDate: date,
                      startTime: slot.start,
                    })
                  }
                />
              )
            })}
          </div>
        )}
      </Card>

      <BookAppointmentDrawer
        open={drawer.open}
        initial={drawer.initial}
        doctors={doctors}
        onClose={() => setDrawer((s) => ({ ...s, open: false }))}
      />
    </Space>
  )
}
