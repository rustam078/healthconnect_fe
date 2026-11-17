import { useState } from 'react'
import { DatePicker, Table, Tag, Typography, Space, Tabs, Input, Row, Col } from 'antd'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { useSchedule } from './doctorPortalHooks.js'
import { enumLabel } from '../../../constants/enums.js'
import { getErrorMessage } from '../../../utils/apiError.js'

const STATUS_COLOR = { SCHEDULED: 'green', COMPLETED: 'blue', CANCELLED: 'red' }

// 24h "HH:mm:ss" -> 12h "hh:mm AM".
const fmtTime = (t) => (t ? dayjs(`2000-01-01T${t}`).format('hh:mm A') : '-')

// The doctor's day: a Schedule tab (not yet completed) and a Completed tab. Rows are sorted
// by slot ascending (server-side); clicking a row opens its consultation workspace.
export default function ScheduleTab() {
  const navigate = useNavigate()
  const [date, setDate] = useState(dayjs())
  const [search, setSearch] = useState('')

  const dateStr = date ? date.format('YYYY-MM-DD') : undefined
  const { data, isFetching, isError, error } = useSchedule(dateStr)
  const rows = (data ?? []).filter((r) => !search.trim() || String(r.appointmentId).includes(search.trim()))
  const scheduled = rows.filter((r) => r.status !== 'COMPLETED')
  const completed = rows.filter((r) => r.status === 'COMPLETED')

  const columns = [
    { title: 'AppointmentId', dataIndex: 'appointmentId', key: 'appointmentId', width: 130 },
    { title: 'Patient', dataIndex: 'patientName', key: 'patientName' },
    { title: 'Time', key: 'time', render: (_, r) => `${fmtTime(r.startTime)} - ${fmtTime(r.endTime)}` },
    { title: 'Age', dataIndex: 'age', key: 'age', width: 70 },
    { title: 'Gender', dataIndex: 'gender', key: 'gender', render: (g) => enumLabel(g) || '—' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Blood', dataIndex: 'bloodGroup', key: 'bloodGroup', width: 80, render: (b) => enumLabel(b) || '—' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s) => (s ? <Tag color={STATUS_COLOR[s] || 'default'}>{enumLabel(s)}</Tag> : '—'),
    },
  ]

  const renderTable = (dataSource) => (
    <Table
      rowKey="appointmentId"
      loading={isFetching}
      columns={columns}
      dataSource={dataSource}
      scroll={{ x: 820 }}
      pagination={false}
      onRow={(r) => ({ onClick: () => navigate(`/doctor/appointments/${r.appointmentId}`), style: { cursor: 'pointer' } })}
    />
  )

  const tabs = [
    { key: 'schedule', label: `Schedule (${scheduled.length})`, children: renderTable(scheduled) },
    { key: 'completed', label: `Completed (${completed.length})`, children: renderTable(completed) },
  ]

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row align="middle" justify="space-between" gutter={[8, 8]} wrap>
        <Col>
          <Typography.Title level={4} style={{ margin: 0 }}>My Schedule</Typography.Title>
        </Col>
        <Col>
          <Space wrap>
            <Input.Search placeholder="Search by Appointment ID" allowClear value={search}
              onChange={(e) => setSearch(e.target.value)} style={{ width: 220 }} />
            <DatePicker value={date} onChange={(d) => setDate(d)} format="DD MMM YYYY" allowClear={false} />
          </Space>
        </Col>
      </Row>
      {isError && <Typography.Text type="danger">{getErrorMessage(error)}</Typography.Text>}
      <Tabs defaultActiveKey="schedule" items={tabs} />
    </Space>
  )
}
