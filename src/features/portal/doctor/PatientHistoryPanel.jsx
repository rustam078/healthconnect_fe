import { useState } from 'react'
import { Card, Button, Tag, Tabs, Descriptions, Table, Input, Typography, Empty, Spin, Drawer, Space, App } from 'antd'
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useFullHistory, useHistoryDetail } from './doctorPortalHooks.js'
import PdfViewer from '../../../components/common/PdfViewer.jsx'
import axiosClient from '../../../api/axiosClient.js'
import { getErrorMessage } from '../../../utils/apiError.js'

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
  const { message } = App.useApp()
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [previewReport, setPreviewReport] = useState(null)
  const { data: items, isLoading } = useFullHistory(patientId)
  const { data: detail, isFetching } = useHistoryDetail(selected)

  if (isLoading) return <Spin />
  if (!items?.length) return <Empty description="No visit history" />

  const reportFileUrl = (id) => `/reports/${id}/file`

  const downloadReport = async (report) => {
    try {
      const blob = await axiosClient.get(reportFileUrl(report.id), { responseType: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = report.originalFileName || 'report'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      message.error(getErrorMessage(e))
    }
  }

  const filtered = items.filter((it) => !search.trim() || String(it.appointmentId).includes(search.trim()))
  const testColumns = [
    { title: 'Test', dataIndex: 'testName', key: 'testName' },
    { title: 'Category', dataIndex: 'category', key: 'category', width: 100, render: (c) => (c === 'RADIOLOGY' ? 'Radiology' : 'Lab') },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 110, render: (s) => <Tag color={s === 'AVAILABLE' ? 'green' : 'orange'}>{s}</Tag> },
    {
      title: 'Action', key: 'action', width: 200,
      render: (_, r) => {
        const ready = r.status === 'AVAILABLE' && r.reportId
        return (
          <Space>
            <Button size="small" icon={<EyeOutlined />} disabled={!ready}
              onClick={() => setPreviewReport({ id: r.reportId, title: r.testName, originalFileName: r.testName })}>Preview</Button>
            <Button size="small" icon={<DownloadOutlined />} disabled={!ready}
              onClick={() => downloadReport({ id: r.reportId, originalFileName: r.testName })}>Download</Button>
          </Space>
        )
      },
    },
  ]

  const detailTabs = detail ? [
    {
      key: 'consultation', label: 'Consultation',
      children: (
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Appointment ID">#{detail.appointmentId}</Descriptions.Item>
          <Descriptions.Item label="Date & Time">
            {dayjs(detail.appointmentDate).format('DD MMM YYYY')} {fmtTime(detail.startTime)}
          </Descriptions.Item>
          <Descriptions.Item label="Doctor">{detail.doctorName || '—'}</Descriptions.Item>
          <Descriptions.Item label="Reason for Visit">{detail.consultation?.chiefComplaint || '—'}</Descriptions.Item>
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
      key: 'reports', label: 'Tests & Reports',
      children: (
        <Table rowKey="id" size="small" pagination={false} columns={testColumns}
          dataSource={detail.tests ?? []} scroll={{ x: 520 }}
          locale={{ emptyText: 'No tests ordered' }} />
      ),
    },
  ] : []

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      <div style={{ width: 320, flex: '0 0 320px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Input.Search placeholder="Search by Appointment ID" allowClear value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 8 }} />
        <div style={{ flex: 1, overflowY: 'auto', ...hideScroll }}>
          {filtered.map((it) => (
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
                  #{it.appointmentId} · {dayjs(it.appointmentDate).format('DD MMM YYYY')}
                </div>
                <Typography.Text type="secondary" ellipsis style={{ fontSize: 12 }}>
                  Dr. {it.doctorName} · {it.diagnosis || '—'}
                </Typography.Text>
              </div>
              <Tag color={STATUS_COLOR[it.status] || 'default'} style={{ margin: 0 }}>{it.status}</Tag>
              <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setSelected(it.appointmentId)} />
            </div>
          ))}
          {filtered.length === 0 && <Empty description="No match" style={{ marginTop: 20 }} />}
        </div>
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

      <Drawer title={previewReport?.title || 'Report'} placement="right" width={680}
        open={Boolean(previewReport)} onClose={() => setPreviewReport(null)} destroyOnHidden>
        {previewReport && (
          <PdfViewer url={reportFileUrl(previewReport.id)} height="calc(100vh - 140px)"
            fileName={previewReport.originalFileName} />
        )}
      </Drawer>
    </div>
  )
}
