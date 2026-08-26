import { Drawer, Descriptions, Tag, Button, Space, Tooltip, Alert } from 'antd'
import { EditOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { getPatients } from '../patients/patientsApi.js'
import { fmt12 } from './slots.js'
import { formatDate } from '../../utils/format.js'

const STATUS_COLOR = { SCHEDULED: 'green', COMPLETED: 'blue', CANCELLED: 'red' }
const NOT_READY = 'This action needs the update/cancel API, which isn’t available yet.'

export default function AppointmentDetailsDrawer({ open, appointment, doctor, onClose }) {
  const patientsQuery = useQuery({
    queryKey: ['appt-patients'],
    queryFn: () => getPatients({ page: 0, size: 100 }),
    enabled: open,
  })

  const a = appointment || {}
  const patient = (patientsQuery.data?.content ?? []).find((p) => p.id === a.patientId)
  const patientName = patient
    ? `${[patient.firstName, patient.lastName].filter(Boolean).join(' ')} (${patient.patientCode})`
    : a.patientId != null
      ? `Patient #${a.patientId}`
      : '—'
  const doctorName = doctor
    ? [doctor.firstName, doctor.lastName].filter(Boolean).join(' ')
    : a.doctorId != null
      ? `Doctor #${a.doctorId}`
      : '—'
  const range =
    a.startTime && a.endTime ? `${fmt12(a.startTime.slice(0, 5))} – ${fmt12(a.endTime.slice(0, 5))}` : '—'

  return (
    <Drawer
      open={open}
      width={440}
      title="Appointment details"
      onClose={onClose}
      destroyOnHidden
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Tooltip title={NOT_READY}>
            <Button icon={<EditOutlined />} disabled>
              Update appointment
            </Button>
          </Tooltip>
          <Tooltip title={NOT_READY}>
            <Button danger icon={<CloseCircleOutlined />} disabled>
              Cancel appointment
            </Button>
          </Tooltip>
        </Space>
      }
    >
      <Descriptions column={1} size="small" colon={false}>
        <Descriptions.Item label="Doctor">{doctorName}</Descriptions.Item>
        <Descriptions.Item label="Patient">{patientName}</Descriptions.Item>
        <Descriptions.Item label="Date">{formatDate(a.appointmentDate) || '—'}</Descriptions.Item>
        <Descriptions.Item label="Time">{range}</Descriptions.Item>
        <Descriptions.Item label="Duration">
          {a.durationMinutes != null ? `${a.durationMinutes} min` : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          {a.status ? <Tag color={STATUS_COLOR[a.status] || 'default'}>{a.status}</Tag> : '—'}
        </Descriptions.Item>
      </Descriptions>

      <Alert
        type="info"
        showIcon
        style={{ marginTop: 16 }}
        message="Update and cancel are coming once those backend APIs are ready."
      />
    </Drawer>
  )
}
