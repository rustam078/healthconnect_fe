import { useState } from 'react'
import { Row, Col, Card, List, Button, Tag, Space, Tabs, Descriptions, Table, Empty, Spin } from 'antd'
import dayjs from 'dayjs'
import { useFullHistory, useHistoryDetail } from './doctorPortalHooks.js'
import ReportsViewer from '../../../components/common/ReportsViewer.jsx'

const MED_COLUMNS = [
  { title: 'Medicine', dataIndex: 'medicineName', key: 'medicineName' },
  { title: 'Dosage', dataIndex: 'dosage', key: 'dosage' },
  { title: 'Frequency', dataIndex: 'frequency', key: 'frequency' },
  { title: 'Duration', dataIndex: 'duration', key: 'duration' },
  { title: 'Remarks', dataIndex: 'instructions', key: 'instructions' },
]
const fmtTime = (t) => (t ? dayjs(`2000-01-01T${t}`).format('hh:mm A') : '')

// The patient's full history across all doctors (left), with a details panel (right).
export default function PatientHistoryPanel({ patientId }) {
  const [selected, setSelected] = useState(null)
  const { data: items, isLoading } = useFullHistory(patientId)
  const { data: detail, isFetching } = useHistoryDetail(selected)

  if (isLoading) return <Spin />
  if (!items?.length) return <Empty description="No visit history" />

  const detailTabs = detail ? [
    {
      key: 'consultation', label: 'Consultation',
      children: (
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Date & Time">
            {dayjs(detail.appointmentDate).format('DD MMM YYYY')} {fmtTime(detail.startTime)}
          </Descriptions.Item>
          <Descriptions.Item label="Doctor">{detail.doctorName || '—'}</Descriptions.Item>
          <Descriptions.Item label="Chief complaint">{detail.consultation?.chiefComplaint || '—'}</Descriptions.Item>
          <Descriptions.Item label="Diagnosis">{detail.consultation?.diagnosis || '—'}</Descriptions.Item>
          <Descriptions.Item label="Notes / Advice">{detail.consultation?.notes || '—'}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'prescription', label: 'Prescription',
      children: (
        <Table rowKey={(r, i) => `${r.medicineName}-${i}`} size="small" pagination={false}
          columns={MED_COLUMNS} dataSource={detail.consultation?.medicines ?? []}
          locale={{ emptyText: 'No prescription' }} />
      ),
    },
    {
      key: 'reports', label: 'Reports',
      children: (
        <ReportsViewer reports={detail.reports ?? []}
          fileUrl={(id) => `/doctor-portal/patients/${patientId}/reports/${id}/file`} height={360} />
      ),
    },
  ] : []

  return (
    <Row gutter={16} align="top">
      <Col xs={24} md={10}>
        <List
          itemLayout="vertical"
          dataSource={items}
          renderItem={(it) => (
            <List.Item
              key={it.appointmentId}
              style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 10 }}
              extra={<Button size="small" onClick={() => setSelected(it.appointmentId)}>View Details</Button>}
            >
              <div style={{ fontWeight: 600 }}>
                {dayjs(it.appointmentDate).format('DD MMM YYYY')} · Dr. {it.doctorName}
              </div>
              <div style={{ color: '#7C8B87', margin: '2px 0 6px' }}>{it.diagnosis || '—'}</div>
              <Space size={6} wrap>
                <Tag color={it.status === 'COMPLETED' ? 'blue' : 'green'}>{it.status}</Tag>
                {it.hasPrescription && <Tag>Prescription</Tag>}
                {it.testCount > 0 && <Tag>Lab Tests ({it.testCount})</Tag>}
              </Space>
            </List.Item>
          )}
        />
      </Col>
      <Col xs={24} md={14}>
        <Card size="small" title="History Details">
          {!selected ? (
            <Empty description="Select a visit to see details" />
          ) : isFetching ? (
            <Spin />
          ) : (
            <Tabs defaultActiveKey="consultation" items={detailTabs} />
          )}
        </Card>
      </Col>
    </Row>
  )
}
