import { useState } from 'react'
import { Card, Table, Typography, Button, Alert } from 'antd'
import { FilePdfOutlined } from '@ant-design/icons'
import { useMyAppointments } from './customerPortalHooks.js'
import PrescriptionModal from './PrescriptionModal.jsx'
import { getErrorMessage } from '../../../utils/apiError.js'

// Past (completed) visits, each with its prescription to view.
export default function MyPrescriptionsPage() {
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)
  const [appointmentId, setAppointmentId] = useState(null)

  const { data, isFetching, isError, error } = useMyAppointments({ page, size })
  const rows = (data?.content ?? []).filter((r) => r.status === 'COMPLETED')
  const total = data?.totalElements ?? 0

  const columns = [
    { title: 'Doctor', dataIndex: 'doctorName', key: 'doctorName' },
    { title: 'Date', dataIndex: 'appointmentDate', key: 'appointmentDate' },
    { title: 'Time', key: 'time', render: (_, r) => `${r.startTime ?? '-'} – ${r.endTime ?? '-'}` },
    {
      title: 'Action',
      key: 'action',
      render: (_, r) => (
        <Button type="link" icon={<FilePdfOutlined />} onClick={() => setAppointmentId(r.id)}>
          View prescription
        </Button>
      ),
    },
  ]

  return (
    <Card>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        My Prescriptions
      </Typography.Title>
      {isError && <Alert type="error" message={getErrorMessage(error)} style={{ marginBottom: 12 }} />}
      <Table
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={rows}
        scroll={{ x: 640 }}
        pagination={{
          current: page,
          pageSize: size,
          total,
          showSizeChanger: true,
          onChange: (p, s) => {
            setPage(p)
            setSize(s)
          },
        }}
      />
      <PrescriptionModal
        appointmentId={appointmentId}
        open={appointmentId != null}
        onClose={() => setAppointmentId(null)}
      />
    </Card>
  )
}
