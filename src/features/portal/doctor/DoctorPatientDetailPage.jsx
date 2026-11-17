import { Card, Descriptions, Tabs, Typography, Button, Space, Spin, Alert, Statistic, Row, Col } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Link, useParams } from 'react-router-dom'
import { usePatientProfile } from './doctorPortalHooks.js'
import PatientHistoryTab from './PatientHistoryTab.jsx'
import PatientReportsTab from './PatientReportsTab.jsx'
import { getErrorMessage } from '../../../utils/apiError.js'

// One patient's full record: overview + stats, visit history (with prescription PDFs), and
// uploaded reports. Visibility is enforced server-side (a patient outside the department 404s).
export default function DoctorPatientDetailPage() {
  const { patientId } = useParams()
  const id = Number(patientId)
  const { data, isLoading, isError, error } = usePatientProfile(id)

  if (isLoading) return <Spin />
  if (isError) return <Alert type="error" message={getErrorMessage(error)} />

  const patient = data?.patient ?? {}
  const stats = data?.stats ?? {}
  const fullName = `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim()

  const overview = (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={16}>
        <Col span={6}><Statistic title="Total visits" value={stats.totalAppointments ?? 0} /></Col>
        <Col span={6}><Statistic title="Upcoming" value={stats.upcomingAppointments ?? 0} /></Col>
        <Col span={6}><Statistic title="Doctors seen" value={stats.doctorsSeen ?? 0} /></Col>
        <Col span={6}><Statistic title="Last visit" value={stats.lastVisitDate ?? '—'} /></Col>
      </Row>
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="Code">{patient.patientCode ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Age">{patient.age ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Gender">{patient.gender ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Blood group">{patient.bloodGroup ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Phone">{patient.phone ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Email">{patient.email ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Address" span={2}>{patient.address ?? '—'}</Descriptions.Item>
      </Descriptions>
    </Space>
  )

  const items = [
    { key: 'overview', label: 'Overview', children: overview },
    { key: 'history', label: 'Visits & Prescriptions', children: <PatientHistoryTab patientId={id} /> },
    { key: 'reports', label: 'Reports', children: <PatientReportsTab patientId={id} /> },
  ]

  return (
    <Card>
      <Space style={{ marginBottom: 12 }}>
        <Link to="/doctor/patients"><Button icon={<ArrowLeftOutlined />}>Back</Button></Link>
        <Typography.Title level={4} style={{ margin: 0 }}>{fullName || 'Patient'}</Typography.Title>
      </Space>
      <Tabs defaultActiveKey="overview" items={items} destroyOnHidden />
    </Card>
  )
}
