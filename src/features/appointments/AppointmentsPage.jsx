import { useState } from 'react'
import { Card, Tabs, Input, DatePicker, Button, Select, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import CalendarTab from './CalendarTab.jsx'
import AllAppointmentsTab from './AllAppointmentsTab.jsx'
import BookAppointmentDrawer from './BookAppointmentDrawer.jsx'
import AppointmentDetailsDrawer from './AppointmentDetailsDrawer.jsx'
import PersonSelect from './PersonSelect.jsx'
import { getDoctors } from '../doctors/doctorsApi.js'
import Can from '../auth/Can.jsx'

const { RangePicker } = DatePicker

const isSunday = (d) => d.day() === 0

const STATUS_OPTIONS = ['SCHEDULED', 'COMPLETED', 'NO_SHOW'].map((s) => ({ label: s, value: s }))

const toDoctorOption = (d) => ({ value: d.id, label: [d.firstName, d.lastName].filter(Boolean).join(' ') })

export default function AppointmentsPage() {
  const [activeKey, setActiveKey] = useState('calendar')

  // Calendar tab state (its filters live in the tab bar).
  const [date, setDate] = useState(() => {
    const t = dayjs()
    return isSunday(t) ? t.add(1, 'day') : t // Sunday is a holiday — start on Monday
  })
  const [search, setSearch] = useState('')
  const [book, setBook] = useState({ open: false, initial: null })

  // All-appointments tab state.
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(1)

  // One detail drawer shared by both tabs (calendar passes the doctor; the table has it on the row).
  const [details, setDetails] = useState({ open: false, appointment: null, doctor: null })

  const openBook = (partial) => setBook({ open: true, initial: { ...partial, key: Date.now() } })
  const openDetails = (appointment, doctor = null) => setDetails({ open: true, appointment, doctor })
  // Any filter change goes back to the first page, so results and pager stay in step.
  const patchFilter = (patch) => {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(1)
  }

  const calendarFilters = (
    <Space wrap>
      <Input.Search
        allowClear
        placeholder="Search doctor"
        style={{ width: 180 }}
        onSearch={setSearch}
        onChange={(e) => { if (!e.target.value) setSearch('') }}
      />
      <DatePicker
        value={date}
        onChange={(d) => d && setDate(d)}
        allowClear={false}
        format="DD MMM YYYY"
        disabledDate={(d) => d && (d < dayjs().startOf('day') || isSunday(d))}
      />
      <Can module="APPOINTMENTS" action="CREATE">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openBook({ appointmentDate: date })}>
          Add appointment
        </Button>
      </Can>
    </Space>
  )

  const allFilters = (
    <Space wrap>
      <Input.Search
        allowClear
        placeholder="Patient name"
        style={{ width: 160 }}
        onSearch={(v) => patchFilter({ patientName: v || undefined })}
        onChange={(e) => { if (!e.target.value) patchFilter({ patientName: undefined }) }}
      />
      <PersonSelect
        queryKey="appt-filter-doctor"
        placeholder="Doctor"
        style={{ width: 180 }}
        fetchPage={getDoctors}
        toOption={toDoctorOption}
        value={filters.doctorId}
        onChange={(v) => patchFilter({ doctorId: v })}
      />
      <Select
        allowClear
        placeholder="Status"
        style={{ width: 140 }}
        options={STATUS_OPTIONS}
        value={filters.status}
        onChange={(v) => patchFilter({ status: v })}
      />
      <RangePicker
        format="DD MMM YYYY"
        value={filters.dateFrom ? [dayjs(filters.dateFrom), dayjs(filters.dateTo)] : null}
        onChange={(r) => patchFilter({
          dateFrom: r?.[0]?.format('YYYY-MM-DD'),
          dateTo: r?.[1]?.format('YYYY-MM-DD'),
        })}
      />
    </Space>
  )

  const items = [
    {
      key: 'calendar',
      label: 'Calendar',
      children: <CalendarTab date={date} search={search} onBook={openBook} onOpenDetails={openDetails} />,
    },
    {
      key: 'all',
      label: 'All appointments',
      children: <AllAppointmentsTab filters={filters} page={page} setPage={setPage} onOpenDetails={openDetails} />,
    },
  ]

  return (
    <>
      <Card styles={{ body: { paddingTop: 8 } }}>
        <Tabs
          activeKey={activeKey}
          onChange={setActiveKey}
          items={items}
          tabBarExtraContent={{ right: activeKey === 'calendar' ? calendarFilters : allFilters }}
        />
      </Card>

      <BookAppointmentDrawer
        open={book.open}
        initial={book.initial}
        onClose={() => setBook((s) => ({ ...s, open: false }))}
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
