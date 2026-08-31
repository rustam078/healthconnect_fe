import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Table,
  Button,
  Tag,
  Space,
  Statistic,
  Typography,
  Row,
  Col,
  Skeleton,
  Result,
  Empty,
} from 'antd'
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { usePatientDetails, usePatientAppointments } from './patientDetailHooks.js'
import PatientFormModal from './PatientFormModal.jsx'
import ConsultationView from '../consultations/ConsultationView.jsx'
import { enumLabel } from '../../constants/enums.js'
import { formatDate } from '../../utils/format.js'
import { getErrorMessage } from '../../utils/apiError.js'

// The same colours the appointment drawer uses, so a status means the same thing
// wherever it is read.
const STATUS_COLOR = { SCHEDULED: 'green', COMPLETED: 'blue', CANCELLED: 'red' }
const GENDER_COLOR = { MALE: 'blue', FEMALE: 'magenta', OTHER: 'default' }

const dash = <span style={{ color: '#9AA7A3' }}>—</span>

// One patient, as a record rather than a row in a table of five thousand.
//
// Two requests, not one: the profile and its four numbers arrive together because they fit
// on a screen, while the visit history is paged - a long-standing patient has more visits
// than anyone wants in a single response.
export default function PatientDetailPage() {
  const navigate = useNavigate()
  const { patientId: param } = useParams()
  const patientId = Number(param)

  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [editOpen, setEditOpen] = useState(false)

  const { data, isLoading, isError, error } = usePatientDetails(patientId)
  const visits = usePatientAppointments(patientId, page, size)

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
        title="Could not load patient"
        subTitle={getErrorMessage(error)}
        extra={<Button onClick={() => navigate('/patients')}>Back to patients</Button>}
      />
    )
  }

  const patient = data?.patient ?? {}
  const stats = data?.stats ?? {}
  const fullName = [patient.firstName, patient.lastName].filter(Boolean).join(' ')

  const visitColumns = [
    {
      title: 'Date',
      dataIndex: 'appointmentDate',
      key: 'appointmentDate',
      width: 130,
      render: (v) => formatDate(v) || dash,
    },
    { title: 'Time', dataIndex: 'startTime', key: 'startTime', width: 100 },
    {
      title: 'Doctor',
      dataIndex: 'doctorName',
      key: 'doctorName',
      // Clickable, because "who did they see" is usually followed by "and what are that
      // doctor's timings" - the doctor page is one hop away rather than a search.
      render: (v, r) =>
        v ? <a onClick={() => navigate(`/doctors/${r.doctorId}`)}>{v}</a> : dash,
    },
    {
      title: 'Duration',
      dataIndex: 'durationMinutes',
      key: 'durationMinutes',
      width: 110,
      render: (v) => (v != null ? `${v} min` : dash),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (v) => (v ? <Tag color={STATUS_COLOR[v] || 'default'}>{enumLabel(v)}</Tag> : dash),
    },
  ]

  return (
    <Space orientation="vertical" size={20} style={{ width: '100%' }}>
      <div>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/patients')}
          style={{ paddingLeft: 0, marginBottom: 4 }}
        >
          Back to patients
        </Button>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {fullName || 'Patient'}
        </Typography.Title>
        <Typography.Text type="secondary">{patient.patientCode}</Typography.Text>
      </div>

      {/* The four numbers worth reading before anything else. A patient with 11 visits
          across 11 doctors is a different conversation from one with 11 visits to the
          same doctor. */}
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card size="small">
            {/* Appointments, not visits: this counts every booking including cancelled
                ones and ones still to come, which is what the table below lists too. */}
            <Statistic title="Total appointments" value={stats.totalAppointments ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Upcoming" value={stats.upcomingAppointments ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Doctors seen" value={stats.doctorsSeen ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            {/* Statistic would print a date as a number, so the value is preformatted. */}
            <Statistic title="Last visit" value={formatDate(stats.lastVisitDate) || '—'} />
          </Card>
        </Col>
      </Row>

      <Card
        title="Profile"
        extra={
          <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        }
      >
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small" colon={false}>
          <Descriptions.Item label="Gender">
            {patient.gender ? (
              <Tag color={GENDER_COLOR[patient.gender] || 'default'}>
                {enumLabel(patient.gender)}
              </Tag>
            ) : (
              dash
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Age">{patient.age ?? dash}</Descriptions.Item>
          <Descriptions.Item label="Date of birth">
            {formatDate(patient.dateOfBirth) || dash}
          </Descriptions.Item>
          <Descriptions.Item label="Blood group">
            {patient.bloodGroup ? (
              <Tag color="cyan">{enumLabel(patient.bloodGroup)}</Tag>
            ) : (
              dash
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Phone">{patient.phone || dash}</Descriptions.Item>
          <Descriptions.Item label="Email">{patient.email || dash}</Descriptions.Item>
          {/* "filled" rather than a number: the column count is responsive, and a fixed
              span overflows the narrower layouts. An address wants the whole line at
              every width anyway. */}
          <Descriptions.Item label="Address" span="filled">
            {patient.address || dash}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Visit history">
        <Table
          rowKey="id"
          size="small"
          loading={visits.isFetching}
          columns={visitColumns}
          dataSource={visits.data?.content ?? []}
          // Expand a visit to read what the doctor recorded - complaint, diagnosis and the
          // prescription. The consultation is fetched only when a row is opened, so a page
          // of visits does not fire a query per row. A cancelled visit never happened, so it
          // has nothing to open.
          expandable={{
            rowExpandable: (r) => r.status !== 'CANCELLED',
            expandedRowRender: (r) => <ConsultationView appointmentId={r.id} enabled />,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="This patient has not been seen yet"
              />
            ),
          }}
          // The rows ARE the page - the server was asked for exactly these - so antd is
          // told the real total and told not to slice anything itself.
          pagination={{
            current: page,
            pageSize: size,
            total: visits.data?.totalElements ?? 0,
            showSizeChanger: true,
            showTotal: (t, range) => `${range[0]}-${range[1]} of ${t}`,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage)
              setSize(nextSize)
            },
          }}
        />
      </Card>

      {/* The list page's own form, reused as-is: one place decides what a patient's
          fields are and how they validate. */}
      <PatientFormModal
        open={editOpen}
        mode="edit"
        initialValues={patient}
        onClose={() => setEditOpen(false)}
      />
    </Space>
  )
}
