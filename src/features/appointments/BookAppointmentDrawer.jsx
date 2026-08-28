import { Drawer, Form, Select, DatePicker, Button, Space, Alert, Spin, Typography, Tooltip, theme, App } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useCreateAppointment } from './appointmentsHooks.js'
import { getPatients } from '../patients/patientsApi.js'
import { getDoctors } from '../doctors/doctorsApi.js'
import { getDoctorDetails } from '../doctors/doctorDetailApi.js'
import { getAppointmentsByDoctor } from './appointmentsApi.js'
import TimeOfDayField from './TimeOfDayField.jsx'
import { buildDaySegments, dayOfWeekOf, fmt12 } from './slots.js'
import { APPOINTMENT_LOOK } from './DoctorDayColumn.jsx'
import { getErrorMessage } from '../../utils/apiError.js'

const { Text } = Typography

// How a taken stretch is drawn. Booked and completed borrow the board's own colours so a
// slot reads the same in the form as it does on the calendar behind it.
const SEGMENT_LOOK = {
  SCHEDULED: { ...APPOINTMENT_LOOK.SCHEDULED, label: 'Booked' },
  COMPLETED: { ...APPOINTMENT_LOOK.COMPLETED, label: 'Completed' },
  break: { label: 'Break', background: '#FBEAC6', border: '#E9CE93', color: '#8A6A1E' },
}

const DURATION_OPTIONS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '60 minutes', value: 60 },
]

export default function BookAppointmentDrawer({ open, initial, onClose }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const createMutation = useCreateAppointment()
  const { token } = theme.useToken()

  const patientsQuery = useQuery({
    queryKey: ['appt-patients'],
    queryFn: () => getPatients({ page: 0, size: 100 }),
    enabled: open,
  })

  // The board behind this drawer only holds the doctors scrolled into view so far, so the
  // list is fetched here instead of being handed down: you must be able to book any doctor,
  // not only the ones that happen to be on screen. One request, and only while open.
  const doctorsQuery = useQuery({
    queryKey: ['appt-doctor-options'],
    queryFn: () => getDoctors({ page: 0, size: 200 }),
    enabled: open,
  })

  const doctorOptions = (doctorsQuery.data?.content ?? []).map((d) => ({
    label: `${[d.firstName, d.lastName].filter(Boolean).join(' ')} — ${d.qualification}`,
    value: d.id,
  }))
  // Watched, not read at submit time: the slot list has to follow whatever is in the form
  // right now, or it would offer times for the doctor you were looking at a moment ago.
  const pickedDoctorId = Form.useWatch('doctorId', form)
  const pickedDate = Form.useWatch('appointmentDate', form)
  const pickedDuration = Form.useWatch('durationMinutes', form)
  const pickedStart = Form.useWatch('startTime', form)?.format('HH:mm')

  const availabilityQuery = useQuery({
    queryKey: ['doctorDetails', pickedDoctorId],
    queryFn: () => getDoctorDetails(pickedDoctorId),
    enabled: open && !!pickedDoctorId,
  })

  const dateStr = pickedDate ? pickedDate.format('YYYY-MM-DD') : null
  const bookedQuery = useQuery({
    queryKey: ['appointments', pickedDoctorId, dateStr],
    queryFn: () => getAppointmentsByDoctor(pickedDoctorId, dateStr),
    enabled: open && !!pickedDoctorId && !!dateStr,
  })

  // A doctor keeps different hours on different weekdays, so the right row is the one for
  // the weekday of the date that was picked.
  const availability = pickedDate
    ? (availabilityQuery.data?.availabilityToSave ?? []).find(
        (av) => av.dayOfWeek === dayOfWeekOf(pickedDate),
      )
    : null

  const daySegments = buildDaySegments({
    availability,
    appointments: bookedQuery.data?.content ?? [],
    date: pickedDate,
    durationMinutes: pickedDuration,
  })

  // Flattened to one row of boxes in time order: a free stretch contributes one box per
  // slot, a taken one contributes a single box covering it.
  const dayCells = daySegments.flatMap((segment) =>
    segment.kind === 'free'
      ? segment.slots.map((slot) => ({ ...slot, kind: 'free' }))
      : [{ ...segment, start: segment.from, label: fmt12(segment.from) }],
  )

  // Only slots that are both free and still ahead count as bookable.
  const freeCount = dayCells.filter((c) => c.kind === 'free' && !c.past).length

  // The taken stretches say who has them, when we happen to know. The name comes from the
  // page of patients already loaded for the Patient field, so it costs nothing extra - and
  // returns null rather than an internal id for anyone outside that page, since "Patient
  // #1356" tells a receptionist less than saying nothing at all.
  const patientNameOf = (id) => {
    const p = (patientsQuery.data?.content ?? []).find((x) => x.id === id)
    return p ? [p.firstName, p.lastName].filter(Boolean).join(' ') : null
  }

  const slotsLoading = availabilityQuery.isFetching || bookedQuery.isFetching
  const readyForSlots = !!pickedDoctorId && !!pickedDate && !!pickedDuration

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
      // Wider than the other drawers: the time field is three boxes and the duration sits
      // beside it, which needs more than a 440px column to fit on one line.
      width={560}
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

        {/* Time and duration side by side, and both above the slots: together they are the
            question the slot list answers ("a 30-minute visit, when?"), so changing either
            visibly redraws what is on offer below. Clicking a slot fills the time in. */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Form.Item
            name="startTime"
            label="Start time"
            rules={[{ required: true, message: 'Pick a start time' }]}
          >
            <TimeOfDayField minuteStep={15} />
          </Form.Item>
          <Form.Item
            name="durationMinutes"
            label="Duration"
            rules={[{ required: true, message: 'Select duration' }]}
          >
            <Select options={DURATION_OPTIONS} style={{ width: 150 }} />
          </Form.Item>
        </div>

        {/* Nobody knows a doctor's hours by heart, and typing a time that turns out to be
            during their break or already taken only fails at submit. So once there is a
            doctor, a date and a length, the times that would actually be accepted are
            listed to be clicked. */}
        <Form.Item label="Available slots" style={{ marginBottom: 0 }}>
          {!readyForSlots ? (
            <Text type="secondary">Pick a doctor, a date and a duration to see open slots.</Text>
          ) : slotsLoading ? (
            <Spin size="small" />
          ) : !availability ? (
            <Alert
              type="warning"
              showIcon
              message="This doctor does not work on that day"
              description="Try another date, or another doctor."
            />
          ) : freeCount === 0 ? (
            <Alert
              type="warning"
              showIcon
              message="No room left on this date"
              description={`${fmt12(availability.startTime.slice(0, 5))} – ${fmt12(availability.endTime.slice(0, 5))} is fully booked for a ${pickedDuration}-minute visit.`}
            />
          ) : (
            <div
              className="hide-scrollbar"
              style={{
                maxHeight: 210,
                overflowY: 'auto',
                padding: 12,
                borderRadius: token.borderRadius,
                background: token.colorFillQuaternary,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              {/* One grid of boxes across the whole working day, in order. A taken stretch
                  keeps its box - coloured, not clickable, and explaining itself on hover -
                  because a list that jumps from 8:30 to 9:45 reads like a bug, while a box
                  saying "booked" answers the question and shows how full the day is. */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                  gap: 6,
                }}
              >
                {dayCells.map((cell) => {
                  if (cell.kind === 'free') {
                    const chosen = pickedStart === cell.start
                    return (
                      <Tooltip
                        key={cell.start}
                        title={cell.past ? 'This time has passed' : `Free · ${cell.label}`}
                      >
                        <Button
                          size="small"
                          block
                          disabled={cell.past}
                          type={chosen ? 'primary' : 'default'}
                          icon={chosen ? <CheckOutlined /> : undefined}
                          onClick={() =>
                            form.setFieldsValue({ startTime: dayjs(`2000-01-01T${cell.start}`) })
                          }
                        >
                          {cell.label}
                        </Button>
                      </Tooltip>
                    )
                  }
                  const busy = SEGMENT_LOOK[cell.kind === 'break' ? 'break' : cell.status] ?? SEGMENT_LOOK.SCHEDULED
                  const who = patientNameOf(cell.patientId)
                  return (
                    <Tooltip
                      key={cell.start}
                      title={`${busy.label} · ${cell.range}${who ? ` · ${who}` : ''}`}
                    >
                      {/* A div, not a disabled Button: antd's disabled buttons swallow the
                          mouse events the tooltip needs. */}
                      <div
                        style={{
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: token.borderRadius,
                          background: busy.background,
                          border: `1px solid ${busy.border}`,
                          color: busy.color,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'not-allowed',
                          userSelect: 'none',
                        }}
                      >
                        {cell.label}
                      </div>
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          )}
        </Form.Item>
      </Form>
    </Drawer>
  )
}
