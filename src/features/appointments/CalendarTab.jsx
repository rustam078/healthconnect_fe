import { useEffect, useMemo, useRef } from 'react'
import { useInfiniteQuery, useQueries } from '@tanstack/react-query'
import { Typography, Space, Skeleton, Empty, Spin } from 'antd'
import { getDoctors } from '../doctors/doctorsApi.js'
import { getDoctorDetails } from '../doctors/doctorDetailApi.js'
import { getAppointmentsByDoctor } from './appointmentsApi.js'
import { dayOfWeekOf, firstBookableStart, TIME_LABELS, ROW_H, HEADER_H } from './slots.js'
import DoctorDayColumn, { APPOINTMENT_LOOK } from './DoctorDayColumn.jsx'
import { getErrorMessage } from '../../utils/apiError.js'
import { BRAND } from '../../app/theme.js'

// Doctors load a chunk at a time: every column costs two more requests (availability +
// appointments), so loading all up front fired hundreds of requests for a board only a dozen
// columns of which fit on screen.
const DOCTORS_PER_CHUNK = 12
const LOAD_MORE_AT = 0.8

const HOVER_CSS = `
.appt-open .appt-open-hint { opacity: 0; color: #37A06E; transition: opacity .12s; }
.appt-open:hover { background: #EAF5F0 !important; }
.appt-open:hover .appt-open-hint { opacity: 1; }
`

function LegendDot({ label, style }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5C6B67' }}>
      <span style={{ width: 14, height: 14, borderRadius: 4, ...style }} />
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

// The doctor-by-day calendar board. Filters (date, doctor search, add) live in the tab bar and
// come in as props; picking a slot or an appointment is handed back up to the parent's drawers.
export default function CalendarTab({ date, search, onBook, onOpenDetails }) {
  const doctorsQuery = useInfiniteQuery({
    queryKey: ['appt-doctors', search],
    queryFn: ({ pageParam }) => getDoctors({ search, page: pageParam, size: DOCTORS_PER_CHUNK }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
  })

  // useMemo, not a bare flatMap: this array is the dependency of the two useQueries below, and a
  // fresh array every render would rebuild both query lists on every render.
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

  // On a wide screen the first chunk may not fill the board, and a board with nothing to scroll
  // can never reach the trigger above. Keep pulling chunks until it overflows.
  useEffect(() => {
    const el = boardRef.current
    if (!el || !hasNextPage || isFetchingNextPage) return
    if (el.scrollWidth <= el.clientWidth) fetchNextPage()
  }, [doctors.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  const detailsQueries = useQueries({
    queries: doctors.map((d) => ({ queryKey: ['doctorDetails', d.id], queryFn: () => getDoctorDetails(d.id) })),
  })

  const dateStr = date.format('YYYY-MM-DD')
  const apptQueries = useQueries({
    queries: doctors.map((d) => ({
      queryKey: ['appointments', d.id, dateStr],
      queryFn: () => getAppointmentsByDoctor(d.id, dateStr),
    })),
  })

  const weekday = dayOfWeekOf(date)
  const countText = doctors.length < totalDoctors
    ? `${doctors.length} of ${totalDoctors} doctors — scroll for more`
    : `${doctors.length} doctor${doctors.length === 1 ? '' : 's'}`

  return (
    <>
      <style>{HOVER_CSS}</style>
      {/* Selected date + colour legend share one row to keep the board high on the screen. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
        <Typography.Text type="secondary">{date.format('dddd, DD MMMM YYYY')} · {countText}</Typography.Text>
        <Space size={14} wrap>
          <LegendDot label="Available" style={{ background: '#FFFFFF', border: '1px solid #D7E0DC' }} />
          <LegendDot label="Break" style={{ background: '#FBEAC6', border: '1px solid #E9CE93' }} />
          <LegendDot label="Booked" style={{ background: APPOINTMENT_LOOK.SCHEDULED.background, border: `1px solid ${APPOINTMENT_LOOK.SCHEDULED.border}` }} />
          <LegendDot label="Completed" style={{ background: APPOINTMENT_LOOK.COMPLETED.background, border: `1px solid ${APPOINTMENT_LOOK.COMPLETED.border}` }} />
          <LegendDot label="Passed" style={{ background: '#E9ECEE', border: '1px solid #D5DADD' }} />
          <LegendDot label="Outside hours" style={{ background: 'repeating-linear-gradient(45deg,#F2F5F4,#F2F5F4 4px,#E8EDEB 4px,#E8EDEB 8px)' }} />
        </Space>
      </div>

      {doctorsQuery.isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : doctorsQuery.isError ? (
        <Typography.Text type="danger">{getErrorMessage(doctorsQuery.error)}</Typography.Text>
      ) : doctors.length === 0 ? (
        <Empty description="No doctors match your search" />
      ) : (
        <div style={{ display: 'flex', border: `1px solid ${BRAND.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <TimeAxis />
          <div ref={boardRef} onScroll={handleBoardScroll} style={{ display: 'flex', overflowX: 'auto', flex: 1 }}>
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
                    onBook({ doctorId: d.id, appointmentDate: date, startTime: firstBookableStart(slot.start, date) })
                  }
                  onPickAppointment={(appt) => onOpenDetails(appt, d)}
                />
              )
            })}
            {isFetchingNextPage && (
              <div style={{ flex: '0 0 120px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${BRAND.border}` }}>
                <Spin size="small" />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
