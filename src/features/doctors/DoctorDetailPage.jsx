import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Button,
  Tag,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Skeleton,
  Result,
  Empty,
  App,
} from 'antd'
import { ArrowLeftOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
  useDoctorDetails,
  useAssignSpecialties,
  useRemoveSpecialty,
} from './doctorDetailHooks.js'
import { useSpecialties } from '../specialties/specialtiesHooks.js'
import WeekCalendar from './WeekCalendar.jsx'
import AvailabilityEditorModal from './AvailabilityEditorModal.jsx'
import { enumLabel } from '../../constants/enums.js'
import { formatCurrency, formatDate } from '../../utils/format.js'
import { getErrorMessage } from '../../utils/apiError.js'


export default function DoctorDetailPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { doctorId: param } = useParams()
  const doctorId = Number(param)

  const { data, isLoading, isError, error } = useDoctorDetails(doctorId)
  const allSpecialties = useSpecialties({ search: '', page: 1, size: 100 })
  const assignMutation = useAssignSpecialties(doctorId)
  const removeMutation = useRemoveSpecialty(doctorId)

  const [editOpen, setEditOpen] = useState(false)
  const [toAdd, setToAdd] = useState([])

  if (isLoading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    )
  }
  if (isError) {
    return (
      <Result
        status="error"
        title="Could not load doctor"
        subTitle={getErrorMessage(error)}
        extra={<Button onClick={() => navigate('/doctors')}>Back to doctors</Button>}
      />
    )
  }

  const doctor = data?.doctor ?? {}
  const assigned = data?.specialties ?? []
  const availability = data?.availabilityToSave ?? []
  const assignedIds = new Set(assigned.map((s) => s.id))
  const options = (allSpecialties.data?.content ?? [])
    .filter((s) => !assignedIds.has(s.id))
    .map((s) => ({ label: s.name, value: s.id }))

  const handleAssign = () => {
    if (!toAdd.length) return
    assignMutation.mutate(toAdd, {
      onSuccess: () => {
        message.success('Specialties assigned')
        setToAdd([])
      },
      onError: (e) => message.error(getErrorMessage(e)),
    })
  }

  const handleRemove = (id) => {
    removeMutation.mutate(id, {
      onSuccess: () => message.success('Specialty removed'),
      onError: (e) => message.error(getErrorMessage(e)),
    })
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/doctors')}
          style={{ paddingLeft: 0, marginBottom: 4 }}
        >
          Back to doctors
        </Button>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {[doctor.firstName, doctor.lastName].filter(Boolean).join(' ')}
        </Typography.Title>
        <Typography.Text type="secondary">
          {doctor.doctorCode} · {doctor.qualification}
        </Typography.Text>
      </div>

      <Card title="Profile">
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small" colon={false}>
          <Descriptions.Item label="Gender">
            {enumLabel(doctor.gender) || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Age">{doctor.age ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Date of birth">{formatDate(doctor.dateOfBirth) || '—'}</Descriptions.Item>
          <Descriptions.Item label="Experience">
            {doctor.experienceYears != null ? `${doctor.experienceYears} yrs` : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Consultation fee">
            {formatCurrency(doctor.consultationFee) || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Phone">{doctor.phone || '—'}</Descriptions.Item>
          <Descriptions.Item label="Email">{doctor.email || '—'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card
            title="Weekly Availability"
            extra={
              <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
                Edit schedule
              </Button>
            }
          >
            <WeekCalendar availability={availability} />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Specialties">
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div style={{ minHeight: 32 }}>
                {assigned.length ? (
                  assigned.map((s) => (
                    <Tag
                      key={s.id}
                      color="cyan"
                      closable
                      onClose={(e) => {
                        e.preventDefault()
                        handleRemove(s.id)
                      }}
                      style={{ marginBottom: 8, padding: '3px 10px', fontSize: 13 }}
                    >
                      {s.name}
                    </Tag>
                  ))
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No specialties assigned"
                    style={{ margin: 0 }}
                  />
                )}
              </div>

              <Space.Compact style={{ width: '100%' }}>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Add specialties"
                  style={{ width: '100%' }}
                  loading={allSpecialties.isFetching}
                  options={options}
                  value={toAdd}
                  onChange={setToAdd}
                  maxTagCount="responsive"
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  loading={assignMutation.isPending}
                  disabled={!toAdd.length}
                  onClick={handleAssign}
                >
                  Assign
                </Button>
              </Space.Compact>
            </Space>
          </Card>
        </Col>
      </Row>

      <AvailabilityEditorModal
        open={editOpen}
        doctorId={doctorId}
        availability={availability}
        onClose={() => setEditOpen(false)}
      />
    </Space>
  )
}
