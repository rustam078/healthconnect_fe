import { useState } from 'react'
import { DatePicker, Table, Button, Tag, Typography, Space, Popconfirm, App } from 'antd'
import { EditOutlined, CheckOutlined, FileTextOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useMyAppointments, useCompleteAppointment } from './doctorPortalHooks.js'
import ConsultationModal from './ConsultationModal.jsx'
import VisitReportsModal from './VisitReportsModal.jsx'
import { enumLabel } from '../../../constants/enums.js'
import { getErrorMessage } from '../../../utils/apiError.js'

const STATUS_COLOR = { SCHEDULED: 'green', COMPLETED: 'blue', CANCELLED: 'red' }

// Today's (or a chosen day's) appointments, with a prescription editor per row.
export default function ScheduleTab() {
  const { message } = App.useApp()
  const [date, setDate] = useState(dayjs())
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)
  const [selected, setSelected] = useState(null)
  const [reportsFor, setReportsFor] = useState(null)
  const complete = useCompleteAppointment()

  const handleComplete = (id) => {
    complete.mutate(id, {
      onSuccess: () => message.success('Appointment marked completed'),
      onError: (e) => message.error(getErrorMessage(e)),
    })
  }

  const dateStr = date ? date.format('YYYY-MM-DD') : undefined
  const { data, isFetching, isError, error } = useMyAppointments({ date: dateStr, page, size })
  const rows = data?.content ?? []
  const total = data?.totalElements ?? 0

  const columns = [
    { title: 'Patient', dataIndex: 'patientName', key: 'patientName' },
    {
      title: 'Time',
      key: 'time',
      render: (_, r) => `${r.startTime ?? '-'} – ${r.endTime ?? '-'}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (s ? <Tag color={STATUS_COLOR[s] || 'default'}>{enumLabel(s)}</Tag> : '—'),
    },
    {
      title: 'Action',
      key: 'action',
      width: 360,
      fixed: 'right',
      render: (_, r) => (
        <Space size={4} wrap>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => setSelected(r)}>
            Prescription
          </Button>
          <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => setReportsFor(r)}>
            Reports
          </Button>
          {r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && (
            <Popconfirm title="Mark this appointment completed?" onConfirm={() => handleComplete(r.id)}>
              <Button type="link" size="small" icon={<CheckOutlined />}>
                Mark completed
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <DatePicker
        value={date}
        onChange={(d) => {
          setDate(d)
          setPage(1)
        }}
        format="DD MMM YYYY"
        allowClear={false}
      />

      {isError && <Typography.Text type="danger">{getErrorMessage(error)}</Typography.Text>}

      <Table
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={rows}
        scroll={{ x: 720 }}
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

      <ConsultationModal
        appointment={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      />

      <VisitReportsModal
        patientId={reportsFor?.patientId}
        appointmentId={reportsFor?.id}
        open={Boolean(reportsFor)}
        onClose={() => setReportsFor(null)}
      />
    </Space>
  )
}
