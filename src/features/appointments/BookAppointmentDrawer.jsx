import { Drawer, Form, Select, DatePicker, TimePicker, Button, Space, App } from 'antd'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useCreateAppointment } from './appointmentsHooks.js'
import { getPatients } from '../patients/patientsApi.js'
import { getErrorMessage } from '../../utils/apiError.js'

const DURATION_OPTIONS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '60 minutes', value: 60 },
]

export default function BookAppointmentDrawer({ open, initial, doctors, onClose }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const createMutation = useCreateAppointment()

  const patientsQuery = useQuery({
    queryKey: ['appt-patients'],
    queryFn: () => getPatients({ page: 0, size: 100 }),
    enabled: open,
  })

  const doctorOptions = (doctors || []).map((d) => ({
    label: `${[d.firstName, d.lastName].filter(Boolean).join(' ')} — ${d.qualification}`,
    value: d.id,
  }))
  const patientOptions = (patientsQuery.data?.content ?? []).map((p) => ({
    label: `${[p.firstName, p.lastName].filter(Boolean).join(' ')} (${p.patientCode})`,
    value: p.id,
  }))

  const handleSubmit = async () => {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    const payload = {
      patientId: values.patientId,
      doctorId: values.doctorId,
      appointmentDate: values.appointmentDate.format('YYYY-MM-DD'),
      startTime: values.startTime.format('HH:mm'),
      durationMinutes: values.durationMinutes,
    }
    createMutation.mutate(payload, {
      onSuccess: () => {
        message.success('Appointment booked')
        onClose()
      },
      onError: (e) => {
        if (e?.fieldErrors) {
          form.setFields(
            Object.entries(e.fieldErrors).map(([name, msg]) => ({ name, errors: [msg] })),
          )
        }
        message.error(getErrorMessage(e))
      },
    })
  }

  return (
    <Drawer
      open={open}
      width={440}
      title="Book Appointment"
      onClose={onClose}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={createMutation.isPending} onClick={handleSubmit}>
            Book
          </Button>
        </Space>
      }
    >
      <Form
        key={initial?.key ?? 'blank'}
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={{
          doctorId: initial?.doctorId ?? undefined,
          patientId: undefined,
          appointmentDate: initial?.appointmentDate ?? dayjs(),
          startTime: initial?.startTime ? dayjs(`2000-01-01T${initial.startTime}`) : null,
          durationMinutes: 30,
        }}
      >
        <Form.Item
          name="doctorId"
          label="Doctor"
          rules={[{ required: true, message: 'Select a doctor' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Select doctor"
            options={doctorOptions}
          />
        </Form.Item>

        <Form.Item
          name="patientId"
          label="Patient"
          rules={[{ required: true, message: 'Select a patient' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Select patient"
            loading={patientsQuery.isFetching}
            options={patientOptions}
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
            disabledDate={(d) => d && (d < dayjs().startOf('day') || d.day() === 0)}
          />
        </Form.Item>

        <Space size={12} style={{ width: '100%' }}>
          <Form.Item
            name="startTime"
            label="Start time"
            rules={[{ required: true, message: 'Pick a start time' }]}
          >
            <TimePicker format="HH:mm" minuteStep={15} style={{ width: 160 }} />
          </Form.Item>
          <Form.Item
            name="durationMinutes"
            label="Duration"
            rules={[{ required: true, message: 'Select duration' }]}
          >
            <Select options={DURATION_OPTIONS} style={{ width: 150 }} />
          </Form.Item>
        </Space>
      </Form>
    </Drawer>
  )
}
