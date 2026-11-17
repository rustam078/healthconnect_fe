import { useState } from 'react'
import { Table, Tag, Space, Button, Popconfirm, Alert, App } from 'antd'
import dayjs from 'dayjs'
import { useMyAppointments, useCancelAppointment } from './customerPortalHooks.js'
import { getErrorMessage } from '../../../utils/apiError.js'
import PrescriptionModal from './PrescriptionModal.jsx'

const STATUS_COLORS = {
  BOOKED: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'red',
  NO_SHOW: 'orange',
}

// An appointment can be cancelled only if it is upcoming and not already cancelled.
function isCancellable(record) {
  if (record.status === 'CANCELLED' || record.status === 'COMPLETED') return false
  return dayjs(`${record.appointmentDate} ${record.startTime}`).isAfter(dayjs())
}

export default function MyAppointmentsTab() {
  const { message } = App.useApp()
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)
  const [prescriptionId, setPrescriptionId] = useState(null)

  const { data, isFetching, isError, error } = useMyAppointments({ page, size })
  const cancel = useCancelAppointment()

  const rows = data?.content ?? []
  const total = data?.totalElements ?? 0

  const handleCancel = (id) => {
    cancel.mutate(id, {
      onSuccess: () => message.success('Appointment cancelled'),
      onError: (e) => message.error(getErrorMessage(e)),
    })
  }

  const columns = [
    { title: 'Doctor', dataIndex: 'doctorName', key: 'doctorName' },
    { title: 'Date', dataIndex: 'appointmentDate', key: 'appointmentDate' },
    {
      title: 'Time',
      key: 'time',
      render: (_, r) => `${r.startTime} - ${r.endTime}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={STATUS_COLORS[status] || 'default'}>{status}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4} wrap>
          <Button size="small" onClick={() => setPrescriptionId(record.id)}>
            View record
          </Button>
          {isCancellable(record) && (
            <Popconfirm title="Cancel this appointment?" onConfirm={() => handleCancel(record.id)}>
              <Button size="small" danger>
                Cancel
              </Button>
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
        appointmentId={prescriptionId}
        open={prescriptionId != null}
        onClose={() => setPrescriptionId(null)}
      />
    </>
  )
}
