import { Table, Tag, Alert } from 'antd'
import { useAppointmentSearch } from './appointmentsHooks.js'
import { fmt12 } from './slots.js'
import { formatDate } from '../../utils/format.js'
import { getErrorMessage } from '../../utils/apiError.js'

const STATUS_COLOR = { SCHEDULED: 'green', COMPLETED: 'blue', NO_SHOW: 'orange' }

const COLUMNS = [
  { title: 'AppointmentID', dataIndex: 'id', key: 'id', width: 90 },
  { title: 'Patient', dataIndex: 'patientName', key: 'patientName', render: (v, r) => v || `Patient #${r.patientId}` },
  { title: 'Doctor', dataIndex: 'doctorName', key: 'doctorName', render: (v, r) => v || `Doctor #${r.doctorId}` },
  { title: 'AppointmentDate', dataIndex: 'appointmentDate', key: 'date', render: (v) => formatDate(v) || '—' },
  {
    title: 'Time', key: 'time',
    render: (_, r) => (r.startTime ? `${fmt12(r.startTime.slice(0, 5))} – ${fmt12((r.endTime || '').slice(0, 5))}` : '—'),
  },
  { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={STATUS_COLOR[s] || 'default'}>{s}</Tag> },
]

// Every doctor's appointments (latest created first), filtered from the tab bar. A row click
// opens the shared appointment detail drawer. No table title - the tab name already says it.
export default function AllAppointmentsTab({ filters, page, setPage, onOpenDetails }) {
  const { data, isFetching, isError, error } = useAppointmentSearch(filters, page)
  const rows = data?.content ?? []
  const total = data?.totalElements ?? 0

  return (
    <>
      {isError && <Alert type="error" showIcon message={getErrorMessage(error)} style={{ marginBottom: 12 }} />}
      <Table
        rowKey="id"
        size="middle"
        loading={isFetching}
        columns={COLUMNS}
        dataSource={rows}
        scroll={{ x: 720 }}
        onRow={(record) => ({ onClick: () => onOpenDetails(record), style: { cursor: 'pointer' } })}
        pagination={{
          current: page, pageSize: 20, total, showSizeChanger: false,
          onChange: setPage, showTotal: (t) => `${t} appointment${t === 1 ? '' : 's'}`,
        }}
      />
    </>
  )
}
