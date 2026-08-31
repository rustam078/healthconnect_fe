import { useEffect, useState } from 'react'
import {
  Drawer,
  Descriptions,
  Tag,
  Button,
  Space,
  Dropdown,
  Divider,
  Form,
  Select,
  DatePicker,
  Typography,
  App,
} from 'antd'
import {
  EditOutlined,
  CloseCircleOutlined,
  CheckOutlined,
  FileTextOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { getDoctors } from '../doctors/doctorsApi.js'
import PersonSelect from './PersonSelect.jsx'
import ConsultationForm from '../consultations/ConsultationForm.jsx'
import ConsultationView from '../consultations/ConsultationView.jsx'
import { useConsultation } from '../consultations/consultationHooks.js'
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
  const { message, modal } = App.useApp()
  const [form] = Form.useForm()
  const [rescheduling, setRescheduling] = useState(false)
  const [recording, setRecording] = useState(false)

  // No preloaded page of patients any more: the appointment itself carries the patient's
  // name, so a page of 100 was being fetched to look up one string - and came up empty for
  // anyone outside it, leaving "Patient #1356" on screen.
  const toDoctorOption = (d) => ({
    label: `${[d.firstName, d.lastName].filter(Boolean).join(' ')} — ${d.qualification}`,
    value: d.id,
  })

  const updateStatus = useUpdateAppointmentStatus()
  const reschedule = useRescheduleAppointment()
  const cancel = useCancelAppointment()

  const a = appointment || {}

  // Is a consultation already on record for this visit? Drives both the read-only view and
  // whether the "Record consultation" button is still on offer.
  const { data: consultation, isLoading: consultationLoading } = useConsultation(a.id, open)
  const hasConsultation = !!consultation

  // Reopening the drawer on another appointment must not leave the previous one's form
  // half-open with its values in it.
  useEffect(() => {
    if (!open) {
      setRescheduling(false)
      setRecording(false)
    }
  }, [open])

  // Straight off the appointment. It falls back to the id only if the server sent no name
  // at all, which no longer happens for a booking that has a patient.
  const patientName = a.patientName || (a.patientId != null ? `Patient #${a.patientId}` : '—')
  // The board hands the doctor down when it has one; otherwise the appointment's own name
  // covers it, so an appointment opened from anywhere still names its doctor.
  const doctorName = doctor
    ? [doctor.firstName, doctor.lastName].filter(Boolean).join(' ')
    : a.doctorName || (a.doctorId != null ? `Doctor #${a.doctorId}` : '—')
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

  // Cancel is destructive and lives in the overflow menu, so it confirms in a dialog rather
  // than the inline Popconfirm a footer button would use.
  const confirmCancel = () =>
    modal.confirm({
      title: 'Cancel this appointment?',
      content: 'The slot goes back on offer.',
      okText: 'Cancel it',
      okButtonProps: { danger: true },
      cancelText: 'Keep it',
      onOk: handleCancel,
    })

  // Update and cancel are the secondary actions - they live behind the header's overflow
  // menu so the footer is left for the two primary ones (record / complete).
  const moreItems = [
    {
      key: 'update',
      icon: <EditOutlined />,
      label: 'Update appointment',
      disabled: rescheduling,
      onClick: startReschedule,
    },
    {
      key: 'cancel',
      icon: <CloseCircleOutlined />,
      label: 'Cancel appointment',
      danger: true,
      onClick: confirmCancel,
    },
  ]

  return (
    <Drawer
      open={open}
      width={680}
      title="Appointment details"
      onClose={onClose}
      destroyOnHidden
      extra={
        isLive && (
          <Dropdown menu={{ items: moreItems }} trigger={['click']} placement="bottomRight">
            <Button icon={<MoreOutlined />} loading={cancel.isPending}>
              More
            </Button>
          </Dropdown>
        )
      }
      footer={
        isLive && (
          <Space style={{ width: '100%', justifyContent: 'flex-end' }} wrap>
            {!hasConsultation && !consultationLoading && (
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                disabled={recording}
                onClick={() => {
                  setRescheduling(false)
                  setRecording(true)
                }}
              >
                Record consultation
              </Button>
            )}
            <Button
              icon={<CheckOutlined />}
              loading={updateStatus.isPending}
              onClick={handleComplete}
            >
              Mark completed
            </Button>
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

      {recording && (
        <ConsultationForm
          appointmentId={a.id}
          onDone={() => setRecording(false)}
          onCancel={() => setRecording(false)}
        />
      )}

      {hasConsultation && <ConsultationView appointmentId={a.id} enabled={open} />}

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
              <PersonSelect
                queryKey="appt-doctor-options"
                placeholder="Select doctor"
                enabled={open && rescheduling}
                fetchPage={getDoctors}
                toOption={toDoctorOption}
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
