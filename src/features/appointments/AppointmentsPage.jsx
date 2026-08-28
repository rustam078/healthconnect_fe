import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQueries } from '@tanstack/react-query'
import { Card, DatePicker, Button, Space, Typography, Alert, Skeleton, Empty, Input, Spin } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getDoctors } from '../doctors/doctorsApi.js'
import { getDoctorDetails } from '../doctors/doctorDetailApi.js'
import { getAppointmentsByDoctor } from './appointmentsApi.js'
import { dayOfWeekOf, firstBookableStart, TIME_LABELS, ROW_H, HEADER_H } from './slots.js'
import DoctorDayColumn, { APPOINTMENT_LOOK } from './DoctorDayColumn.jsx'
import BookAppointmentDrawer from './BookAppointmentDrawer.jsx'
import AppointmentDetailsDrawer from './AppointmentDetailsDrawer.jsx'
import { getErrorMessage } from '../../utils/apiError.js'
import { BRAND } from '../../app/theme.js'

const isSunday = (d) => d.day() === 0

// Doctors are loaded a chunk at a time. Every doctor column costs two more requests (their
// availability and their appointments for the day), so loading all 200 up front fired
// hundreds of requests to draw a board only a dozen columns of which fit on screen.
const DOCTORS_PER_CHUNK = 12

// How far along the board you have to scroll before the next chunk is fetched. Early
// enough that the columns are usually there by the time you reach them.
const LOAD_MORE_AT = 0.8

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
  const [date, setDate] = useState(() => {
    const t = dayjs()
    return isSunday(t) ? t.add(1, 'day') : t // Sunday is a holiday — start on Monday
  })
  const [drawer, setDrawer] = useState({ open: false, initial: null })
  const [search, setSearch] = useState('')

  const doctorsQuery = useInfiniteQuery({
    queryKey: ['appt-doctors', search],
    queryFn: ({ pageParam }) => getDoctors({ search, page: pageParam, size: DOCTORS_PER_CHUNK }),
    initialPageParam: 0,
    // Spring tells us which page this was and whether it was the last one, so there is
    // nothing to count here.
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
  })

  // useMemo, not a bare flatMap: this array is the dependency of the two useQueries below,
  // and a fresh array every render would rebuild both query lists on every render.
  const doctors = useMemo(
    () => doctorsQuery.data?.pages.flatMap((p) => p.content ?? []) ?? [],
    [doctorsQuery.data],
  )
  const totalDoctors = doctorsQuery.data?.pages[0]?.totalElements ?? doctors.length

  const boardRef = useRef(null)
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = doctorsQuery

  const handleBoardScroll = (e) => {
    const el = e.currentTarget
    const scrollable = el.scrollWidth - el.clientWidth
    if (scrollable <= 0 || !hasNextPage || isFetchingNextPage) return
    if (el.scrollLeft / scrollable >= LOAD_MORE_AT) fetchNextPage()
  }

  // On a wide screen the first chunk may not fill the board, and a board with nothing to
  // scroll can never reach the trigger above. Keep pulling chunks until it overflows.
  useEffect(() => {
    const el = boardRef.current
    if (!el || !hasNextPage || isFetchingNextPage) return
    if (el.scrollWidth <= el.clientWidth) fetchNextPage()
  }, [doctors.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  const detailsQueries = useQueries({
    queries: doctors.map((d) => ({
      queryKey: ['doctorDetails', d.id],
      queryFn: () => getDoctorDetails(d.id),
    })),
  })

  const dateStr = date.format('YYYY-MM-DD')
  const apptQueries = useQueries({
    queries: doctors.map((d) => ({
      queryKey: ['appointments', d.id, dateStr],
      queryFn: () => getAppointmentsByDoctor(d.id, dateStr),
    })),
  })

  const [details, setDetails] = useState({ open: false, appointment: null, doctor: null })

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
            <Typography.Text type="secondary">
              {date.format('dddd, DD MMMM YYYY')} ·{' '}
              {doctors.length < totalDoctors
                ? `${doctors.length} of ${totalDoctors} doctors — scroll for more`
                : `${doctors.length} doctor${doctors.length === 1 ? '' : 's'}`}
            </Typography.Text>
          </div>
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="Search doctor"
              style={{ width: 200 }}
              onSearch={setSearch}
              onChange={(e) => {
                if (!e.target.value) setSearch('')
              }}
            />
            <DatePicker
              value={date}
              onChange={(d) => d && setDate(d)}
              allowClear={false}
              format="DD MMM YYYY"
              disabledDate={(d) => d && (d < dayjs().startOf('day') || isSunday(d))}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openBook({ appointmentDate: date })}>
              Add appointment
            </Button>
          </Space>
        </Space>

        <Space size={18} wrap style={{ marginBottom: 12 }}>
          <LegendDot label="Available" style={{ background: '#FFFFFF', border: '1px solid #D7E0DC' }} />
          <LegendDot label="Break" style={{ background: '#FBEAC6', border: '1px solid #E9CE93' }} />
          <LegendDot
            label="Booked"
            style={{ background: APPOINTMENT_LOOK.SCHEDULED.background, border: `1px solid ${APPOINTMENT_LOOK.SCHEDULED.border}` }}
          />
          <LegendDot
            label="Completed"
            style={{ background: APPOINTMENT_LOOK.COMPLETED.background, border: `1px solid ${APPOINTMENT_LOOK.COMPLETED.border}` }}
          />
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
          <Empty description="No doctors match your search" />
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
            <div
              ref={boardRef}
              onScroll={handleBoardScroll}
              style={{ display: 'flex', overflowX: 'auto', flex: 1 }}
            >
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
                    appointments={apptQueries[i]?.data?.content ?? []}
                    onPick={(slot) =>
                      openBook({
                        doctorId: d.id,
                        appointmentDate: date,
                        // Not slot.start: clicking the hour you are already inside would
                        // otherwise pre-fill a time that has been and gone.
                        startTime: firstBookableStart(slot.start, date),
                      })
                    }
                    onPickAppointment={(appt) =>
                      setDetails({ open: true, appointment: appt, doctor: d })
                    }
                  />
                )
              })}
              {isFetchingNextPage && (
                <div
                  style={{
                    flex: '0 0 120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderLeft: `1px solid ${BRAND.border}`,
                  }}
                >
                  <Spin size="small" />
                </div>
              )}
            </div>
          </div>
        )}

        <Alert
          type="info"
          showIcon
          style={{ marginTop: 12 }}
          message="Green = booked (click for details). White slots are open — click to book."
        />
      </Card>

      <BookAppointmentDrawer
        open={drawer.open}
        initial={drawer.initial}
        onClose={() => setDrawer((s) => ({ ...s, open: false }))}
      />

      <AppointmentDetailsDrawer
        open={details.open}
        appointment={details.appointment}
        doctor={details.doctor}
        onClose={() => setDetails((s) => ({ ...s, open: false }))}
      />
    </>
  )
}
