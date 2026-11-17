import { useState } from 'react'
import { InputNumber, Button, Table, Tag, Space, Typography } from 'antd'
import { SearchOutlined, FilePdfOutlined, FileTextOutlined } from '@ant-design/icons'
import { usePatientHistory } from './doctorPortalHooks.js'
import PdfModal from './PdfModal.jsx'
import VisitReportsModal from './VisitReportsModal.jsx'
import { enumLabel } from '../../../constants/enums.js'
import { getErrorMessage } from '../../../utils/apiError.js'

const STATUS_COLOR = { SCHEDULED: 'green', COMPLETED: 'blue', CANCELLED: 'red' }

// A patient's past visits; each row previews its consultation PDF. When a patientId prop is
// given (patient detail page) the lookup box is hidden and that patient is used directly.
export default function PatientHistoryTab({ patientId: externalId = null }) {
  const [draft, setDraft] = useState(null)
  const [internalId, setInternalId] = useState(null)
  const [pdfFor, setPdfFor] = useState(null)
  const [reportsFor, setReportsFor] = useState(null)
  const patientId = externalId ?? internalId

  const { data, isFetching, isError, error } = usePatientHistory(patientId)
  const rows = data ?? []

  const columns = [
    { title: 'Date', dataIndex: 'appointmentDate', key: 'appointmentDate' },
    { title: 'Time', key: 'time', render: (_, r) => `${r.startTime ?? '-'} – ${r.endTime ?? '-'}` },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (s ? <Tag color={STATUS_COLOR[s] || 'default'}>{enumLabel(s)}</Tag> : '—'),
    },
    {
      title: 'Action',
      key: 'action',
      width: 280,
      render: (_, r) => (
        <Space size={4} wrap>
          <Button type="link" size="small" icon={<FilePdfOutlined />} onClick={() => setPdfFor(r.id)}>
            Prescription
          </Button>
          <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => setReportsFor(r.id)}>
            Reports
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {externalId == null && (
        <Space>
          <InputNumber
            min={1}
            placeholder="Patient ID"
            value={draft}
            onChange={setDraft}
            onPressEnter={() => setInternalId(draft)}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => setInternalId(draft)}>
            Load visits
          </Button>
        </Space>
      )}

      {isError && <Typography.Text type="danger">{getErrorMessage(error)}</Typography.Text>}

      {patientId != null && (
        <Table
          rowKey="id"
          loading={isFetching}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 720 }}
          pagination={false}
        />
      )}

      <PdfModal
        title="Prescription"
        url={pdfFor ? `/doctor-portal/appointments/${pdfFor}/consultation/pdf` : null}
        open={pdfFor != null}
        onClose={() => setPdfFor(null)}
      />

      <VisitReportsModal
        patientId={patientId}
        appointmentId={reportsFor}
        open={reportsFor != null}
        onClose={() => setReportsFor(null)}
      />
    </Space>
  )
}
