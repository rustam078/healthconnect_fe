import { useState } from 'react'
import { Card, Button, Tag, Tabs, Descriptions, Table, Typography, Empty, Spin } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
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
const STATUS_COLOR = { SCHEDULED: 'green', COMPLETED: 'blue', CANCELLED: 'red' }
const fmtTime = (t) => (t ? dayjs(`2000-01-01T${t}`).format('hh:mm A') : '')
const hideScroll = { scrollbarWidth: 'none', msOverflowStyle: 'none' }

// Full-height split: compact one-row visit list on the left, details on the right.
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
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      <div style={{ width: 320, flex: '0 0 320px', overflowY: 'auto', ...hideScroll }}>
        {items.map((it) => (
          <div
            key={it.appointmentId}
            onClick={() => setSelected(it.appointmentId)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
              borderBottom: '1px solid #f0f0f0', cursor: 'pointer', borderRadius: 6,
              background: selected === it.appointmentId ? '#e6f4f1' : undefined,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {dayjs(it.appointmentDate).format('DD MMM YYYY')} · Dr. {it.doctorName}
              </div>
              <Typography.Text type="secondary" ellipsis style={{ fontSize: 12 }}>
                {it.diagnosis || '—'}
              </Typography.Text>
            </div>
            <Tag color={STATUS_COLOR[it.status] || 'default'} style={{ margin: 0 }}>{it.status}</Tag>
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setSelected(it.appointmentId)} />
          </div>
        ))}
      </div>

      <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
        <Card size="small" title="History Details" style={{ height: '100%' }}
          styles={{ body: { height: 'calc(100% - 40px)', overflowY: 'auto', ...hideScroll } }}>
          {!selected ? (
            <Empty description="Select a visit to see details" />
          ) : isFetching ? (
            <Spin />
          ) : (
            <Tabs defaultActiveKey="consultation" items={detailTabs} />
          )}
        </Card>
      </div>
    </div>
  )
}
