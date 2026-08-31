import { useState } from 'react'
import { Descriptions, Table, Divider, Empty, Skeleton, Alert, Typography, Button, Space, App } from 'antd'
import { FilePdfOutlined } from '@ant-design/icons'
import { useConsultation } from './consultationHooks.js'
import { getConsultationPdf } from './consultationApi.js'
import { getErrorMessage } from '../../utils/apiError.js'

const MEDICINE_COLUMNS = [
  { title: 'Medicine', dataIndex: 'medicineName', key: 'medicineName' },
  { title: 'Dosage', dataIndex: 'dosage', key: 'dosage', render: (v) => v || '—' },
  { title: 'Frequency', dataIndex: 'frequency', key: 'frequency', render: (v) => v || '—' },
  { title: 'Duration', dataIndex: 'duration', key: 'duration', render: (v) => v || '—' },
  { title: 'Instructions', dataIndex: 'instructions', key: 'instructions', render: (v) => v || '—' },
]

// Read-only record of a completed visit. Shown when an appointment is opened that has
// already been written up, so a doctor can see later what the problem and prescription were.
// "Anita Sharma" + "2026-08-31" -> "consultation-anita-sharma-2026-08-31.pdf"
function pdfFileName(label, dateIso) {
  const slug = (label || 'record')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const date = (dateIso || '').slice(0, 10)
  return `consultation-${slug}${date ? `-${date}` : ''}.pdf`
}

export default function ConsultationView({ appointmentId, enabled, fileLabel }) {
  const { message } = App.useApp()
  const { data, isLoading, isError, error } = useConsultation(appointmentId, enabled)
  const [pdfLoading, setPdfLoading] = useState(false)

  // Fetch the rendered PDF and download it straight away under a meaningful name. The blob
  // URL is revoked shortly after so it does not leak.
  const downloadPdf = async () => {
    setPdfLoading(true)
    try {
      const blob = await getConsultationPdf(appointmentId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = pdfFileName(fileLabel, data?.createdAt)
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch (e) {
      message.error(getErrorMessage(e))
    } finally {
      setPdfLoading(false)
    }
  }

  if (isLoading) return <Skeleton active paragraph={{ rows: 4 }} />
  if (isError) return <Alert type="error" showIcon message={getErrorMessage(error)} />
  if (!data) return <Empty description="No consultation was recorded for this visit." />

  return (
    <>
      <Divider orientation="left" orientationMargin={0}>
        Consultation
      </Divider>
      <Space style={{ width: '100%', justifyContent: 'flex-end', marginBottom: 8 }}>
        <Button icon={<FilePdfOutlined />} loading={pdfLoading} onClick={downloadPdf}>
          Download PDF
        </Button>
      </Space>
      <Descriptions column={1} size="small" colon={false}>
        <Descriptions.Item label="Chief complaint">{data.chiefComplaint || '—'}</Descriptions.Item>
        <Descriptions.Item label="Diagnosis">{data.diagnosis || '—'}</Descriptions.Item>
        <Descriptions.Item label="Notes">{data.notes || '—'}</Descriptions.Item>
      </Descriptions>

      <Divider orientation="left" orientationMargin={0}>
        Prescription
      </Divider>
      {data.medicines?.length ? (
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          columns={MEDICINE_COLUMNS}
          dataSource={data.medicines}
          scroll={{ x: true }}
        />
      ) : (
        <Typography.Text type="secondary">No medicines were prescribed.</Typography.Text>
      )}
    </>
  )
}
