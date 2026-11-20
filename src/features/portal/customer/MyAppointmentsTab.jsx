import { useState } from 'react'
import { Table, Tag, Space, Button, Popconfirm, Alert, Drawer, App } from 'antd'
import { FilePdfOutlined, FileTextOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useMyAppointments, useCancelAppointment, useMyReports } from './customerPortalHooks.js'
import PdfViewer from '../../../components/common/PdfViewer.jsx'
import ReportsViewer from '../../../components/common/ReportsViewer.jsx'
import { getErrorMessage } from '../../../utils/apiError.js'

const STATUS_COLORS = { BOOKED: 'blue', SCHEDULED: 'green', COMPLETED: 'blue', CANCELLED: 'red', NO_SHOW: 'orange' }

// An appointment can be cancelled only if it is upcoming and not already cancelled/completed.
function isCancellable(record) {
  if (record.status === 'CANCELLED' || record.status === 'COMPLETED') return false
  return dayjs(`${record.appointmentDate} ${record.startTime}`).isAfter(dayjs())
}

export default function MyAppointmentsTab({ search = '' }) {
  const { message } = App.useApp()
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)
  const [pdfFor, setPdfFor] = useState(null)
  const [reportsFor, setReportsFor] = useState(null)

  const { data, isFetching, isError, error } = useMyAppointments({ page, size })
  const { data: allReports } = useMyReports()
  const cancel = useCancelAppointment()

  const q = search.trim().toLowerCase()
  const rows = (data?.content ?? []).filter((r) =>
    !q || String(r.id).includes(q) || (r.doctorName ?? '').toLowerCase().includes(q))
  const total = data?.totalElements ?? 0
  const visitReports = (allReports ?? []).filter((r) => r.appointmentId === reportsFor)

  const handleCancel = (id) => {
    cancel.mutate(id, {
      onSuccess: () => message.success('Appointment cancelled'),
      onError: (e) => message.error(getErrorMessage(e)),
    })
  }

  const columns = [
    { title: 'AppointmentId', dataIndex: 'id', key: 'id', width: 130 },
    { title: 'Doctor', dataIndex: 'doctorName', key: 'doctorName' },
    { title: 'Date', dataIndex: 'appointmentDate', key: 'appointmentDate' },
    { title: 'Time', key: 'time', render: (_, r) => `${r.startTime ?? '-'} - ${r.endTime ?? '-'}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={STATUS_COLORS[s] || 'default'}>{s}</Tag> },
    {
      title: 'Action', key: 'action', width: 350,
      render: (_, r) => (
        <Space size={4} wrap>
          <Button type="link" size="small" icon={<FilePdfOutlined />} onClick={() => setPdfFor(r.id)}>Prescription</Button>
          <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => setReportsFor(r.id)}>Reports</Button>
          {isCancellable(r) && (
            <Popconfirm title="Cancel this appointment?" onConfirm={() => handleCancel(r.id)}>
              <Button type="link" size="small" danger>Cancel</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <>
      {isError && <Alert type="error" message={getErrorMessage(error)} style={{ marginBottom: 12 }} />}
      <Table
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={rows}
        scroll={{ x: 760 }}
        pagination={{
          current: page, pageSize: size, total, showSizeChanger: true,
          onChange: (p, s) => { setPage(p); setSize(s) },
        }}
      />

      <Drawer title="Prescription" placement="right" width={680} open={pdfFor != null}
        onClose={() => setPdfFor(null)} destroyOnHidden>
        {pdfFor && (
          <PdfViewer url={`/appointments/${pdfFor}/consultation/pdf`}
            height="calc(100vh - 140px)" emptyText="No prescription recorded for this visit." />
        )}
      </Drawer>

      <Drawer title="Visit reports" placement="right" width={720} open={reportsFor != null}
        onClose={() => setReportsFor(null)} destroyOnHidden>
        <ReportsViewer reports={visitReports}
          fileUrl={(rid) => `/customer-portal/reports/${rid}/file`} height="calc(100vh - 200px)" />
      </Drawer>
    </>
  )
}
