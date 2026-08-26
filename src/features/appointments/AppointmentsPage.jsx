import { useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { Card, DatePicker, Button, Space, Typography, Alert, Skeleton, Empty } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getDoctors } from '../doctors/doctorsApi.js'
import { getDoctorDetails } from '../doctors/doctorDetailApi.js'
import { dayOfWeekOf, TIME_LABELS, ROW_H, HEADER_H } from './slots.js'
import DoctorDayColumn from './DoctorDayColumn.jsx'
import BookAppointmentDrawer from './BookAppointmentDrawer.jsx'
import { getErrorMessage } from '../../utils/apiError.js'
import { BRAND } from '../../app/theme.js'

const HOVER_CSS = `
.appt-open .appt-open-hint { opacity: 0; color: #37A06E; transition: opacity .12s; }
.appt-open:hover { background: #EAF5F0 !important; }
.appt-open:hover .appt-open-hint { opacity: 1; }
`

function LegendDot({ label, style }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5C6B67' }}>
      <span style={{ width: 16, height: 16, borderRadius: 4, ...style }} />
      {label}
    </span>
  )
}

function TimeAxis() {
  return (
    <div style={{ flex: '0 0 62px', width: 62, borderRight: `1px solid ${BRAND.border}` }}>
      <div style={{ height: HEADER_H, background: '#FAFCFB', borderBottom: `1px solid ${BRAND.border}` }} />
      {TIME_LABELS.map((label, i) => (
        <div
          key={label}
          style={{
            height: ROW_H,
            borderBottom: i === TIME_LABELS.length - 1 ? 'none' : '1px solid #EDF1EF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 8,
            fontSize: 11,
            color: '#8A9793',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      ))}
    </div>
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
  const openBook = (partial) => setDrawer({ open: true, initial: { ...partial, key: Date.now() } })

  return (
    <>
      <style>{HOVER_CSS}</style>
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
            <Typography.Text type="secondary">{date.format('dddd, DD MMMM YYYY')}</Typography.Text>
          </div>
          <Space wrap>
            <DatePicker
              value={date}
              onChange={(d) => d && setDate(d)}
              allowClear={false}
              format="DD MMM YYYY"
              disabledDate={(d) => d && d < dayjs().startOf('day')}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openBook({ appointmentDate: date })}>
              Add appointment
            </Button>
          </Space>
        </Space>

        <Space size={18} wrap style={{ marginBottom: 12 }}>
          <LegendDot label="Available" style={{ background: '#FFFFFF', border: '1px solid #D7E0DC' }} />
          <LegendDot label="Break" style={{ background: '#FBEAC6', border: '1px solid #E9CE93' }} />
          <LegendDot label="Booked" style={{ background: 'rgba(34,158,102,0.18)', border: '1px solid #37A06E' }} />
          <LegendDot label="Passed" style={{ background: '#E9ECEE', border: '1px solid #D5DADD' }} />
          <LegendDot
            label="Outside hours"
            style={{ background: 'repeating-linear-gradient(45deg,#F2F5F4,#F2F5F4 4px,#E8EDEB 4px,#E8EDEB 8px)' }}
          />
        </Space>

        {doctorsQuery.isLoading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : doctorsQuery.isError ? (
          <Typography.Text type="danger">{getErrorMessage(doctorsQuery.error)}</Typography.Text>
        ) : doctors.length === 0 ? (
          <Empty description="No doctors found" />
        ) : (
          <div
            style={{
              display: 'flex',
              border: `1px solid ${BRAND.border}`,
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <TimeAxis />
            <div style={{ display: 'flex', overflowX: 'auto', flex: 1 }}>
              {doctors.map((d, i) => {
                const details = detailsQueries[i]?.data
                const availability = (details?.availabilityToSave ?? []).find((a) => a.dayOfWeek === weekday)
                return (
                  <DoctorDayColumn
                    key={d.id}
                    doctor={d}
                    availability={availability}
                    date={date}
                    loading={detailsQueries[i]?.isLoading}
                    onPick={(slot) =>
                      openBook({ doctorId: d.id, appointmentDate: date, startTime: slot.start })
                    }
                  />
                )
              })}
            </div>
          </div>
        )}

        <Alert
          type="info"
          showIcon
          style={{ marginTop: 12 }}
          message="Booked slots aren't marked yet — the appointment listing API is still in progress. Any white slot can be booked."
        />
      </Card>

      <BookAppointmentDrawer
        open={drawer.open}
        initial={drawer.initial}
        doctors={doctors}
        onClose={() => setDrawer((s) => ({ ...s, open: false }))}
      />
    </>
  )
}
