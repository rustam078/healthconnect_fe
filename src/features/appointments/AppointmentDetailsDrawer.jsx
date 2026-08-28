import { useEffect, useState } from 'react'
import {
  Drawer,
  Descriptions,
  Tag,
  Button,
  Space,
  Popconfirm,
  Divider,
  Form,
  Select,
  DatePicker,
  Typography,
  App,
} from 'antd'
import { EditOutlined, CloseCircleOutlined, CheckOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { getPatients } from '../patients/patientsApi.js'
import { getDoctors } from '../doctors/doctorsApi.js'
import {
  useUpdateAppointmentStatus,
  useRescheduleAppointment,
  useCancelAppointment,
} from './appointmentsHooks.js'
import TimeOfDayField from './TimeOfDayField.jsx'
import { fmt12 } from './slots.js'
import { formatDate } from '../../utils/format.js'
import { getErrorMessage } from '../../utils/apiError.js'

const STATUS_COLOR = { SCHEDULED: 'green', COMPLETED: 'blue', CANCELLED: 'red' }

const DURATION_OPTIONS = [15, 30, 45, 60].map((v) => ({ label: `${v} minutes`, value: v }))

export default function AppointmentDetailsDrawer({ open, appointment, doctor, onClose }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [rescheduling, setRescheduling] = useState(false)

  const patientsQuery = useQuery({
    queryKey: ['appt-patients'],
    queryFn: () => getPatients({ page: 0, size: 100 }),
    enabled: open,
  })

  // The board holds only the doctors scrolled into view, so the list is fetched here:
  // moving an appointment to a doctor who happens to be off screen must still be possible.
  const doctorsQuery = useQuery({
    queryKey: ['appt-doctor-options'],
    queryFn: () => getDoctors({ page: 0, size: 200 }),
    enabled: open && rescheduling,
  })

  const updateStatus = useUpdateAppointmentStatus()
  const reschedule = useRescheduleAppointment()
  const cancel = useCancelAppointment()

  const a = appointment || {}

  // Reopening the drawer on another appointment must not leave the previous one's form
  // half-open with its values in it.
  useEffect(() => {
    if (!open) setRescheduling(false)
  }, [open])

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

  // SCHEDULED is the only live state: the backend's state machine refuses to move a
  // COMPLETED or CANCELLED appointment anywhere, so the buttons go away rather than
  // offering an action that can only fail.
  const isLive = a.status === 'SCHEDULED'

  const startReschedule = () => {
    form.setFieldsValue({
      doctorId: a.doctorId,
      appointmentDate: a.appointmentDate ? dayjs(a.appointmentDate) : null,
      startTime: a.startTime ? dayjs(`2000-01-01T${a.startTime}`) : null,
      durationMinutes: a.durationMinutes ?? 30,
    })
    setRescheduling(true)
  }

  const handleReschedule = async () => {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    reschedule.mutate(
      {
        id: a.id,
        doctorId: values.doctorId,
        appointmentDate: values.appointmentDate.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm'),
        durationMinutes: values.durationMinutes,
      },
      {
        onSuccess: () => {
          message.success('Appointment moved')
          setRescheduling(false)
          onClose()
        },
        onError: (e) => message.error(getErrorMessage(e)),
      },
    )
  }

  const handleComplete = () =>
    updateStatus.mutate(
      { id: a.id, status: 'COMPLETED' },
      {
        onSuccess: () => {
          message.success('Marked as completed')
          onClose()
        },
        onError: (e) => message.error(getErrorMessage(e)),
      },
    )

  const handleCancel = () =>
    cancel.mutate(a.id, {
      onSuccess: () => {
        message.success('Appointment cancelled')
        onClose()
      },
      onError: (e) => message.error(getErrorMessage(e)),
    })

  return (
    <Drawer
      open={open}
      width={440}
      title="Appointment details"
      onClose={onClose}
      destroyOnHidden
      footer={
        isLive && (
          <Space style={{ width: '100%', justifyContent: 'flex-end' }} wrap>
            <Button
              icon={<CheckOutlined />}
              loading={updateStatus.isPending}
              onClick={handleComplete}
            >
              Mark completed
            </Button>
            <Button icon={<EditOutlined />} disabled={rescheduling} onClick={startReschedule}>
              Update appointment
            </Button>
            <Popconfirm
              title="Cancel this appointment?"
              description="The slot goes back on offer."
              okText="Cancel it"
              okButtonProps={{ danger: true }}
              onConfirm={handleCancel}
            >
              <Button danger icon={<CloseCircleOutlined />} loading={cancel.isPending}>
                Cancel appointment
              </Button>
            </Popconfirm>
          </Space>
        )
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

      {rescheduling && (
        <>
          <Divider orientation="left" orientationMargin={0}>
            Move this appointment
          </Divider>
          <Typography.Text type="secondary">
            The patient stays the same. Only the doctor and the time can change.
          </Typography.Text>
          <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
            <Form.Item
              name="doctorId"
              label="Doctor"
              rules={[{ required: true, message: 'Select a doctor' }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                loading={doctorsQuery.isLoading}
                options={(doctorsQuery.data?.content ?? []).map((d) => ({
                  label: `${[d.firstName, d.lastName].filter(Boolean).join(' ')} — ${d.qualification}`,
                  value: d.id,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="appointmentDate"
              label="Date"
              rules={[{ required: true, message: 'Pick a date' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD MMM YYYY"
                disabledDate={(d) => d && d < dayjs().startOf('day')}
              />
            </Form.Item>
            <Form.Item
              name="startTime"
              label="Start time"
              rules={[{ required: true, message: 'Pick a time' }]}
            >
              <TimeOfDayField minuteStep={15} />
            </Form.Item>
            <Form.Item
              name="durationMinutes"
              label="Duration"
              rules={[{ required: true, message: 'Pick a duration' }]}
            >
              <Select options={DURATION_OPTIONS} />
            </Form.Item>
            <Space>
              <Button type="primary" loading={reschedule.isPending} onClick={handleReschedule}>
                Save changes
              </Button>
              <Button onClick={() => setRescheduling(false)}>Discard</Button>
            </Space>
          </Form>
        </>
      )}
    </Drawer>
  )
}
