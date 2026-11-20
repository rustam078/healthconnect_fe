import { useState } from 'react'
import { InputNumber, Button, Table, Tag, Space, Typography, Drawer } from 'antd'
import { SearchOutlined, FilePdfOutlined, FileTextOutlined } from '@ant-design/icons'
import { usePatientHistory, usePatientReports } from './doctorPortalHooks.js'
import PdfViewer from '../../../components/common/PdfViewer.jsx'
import ReportsViewer from '../../../components/common/ReportsViewer.jsx'
import { enumLabel } from '../../../constants/enums.js'
import { getErrorMessage } from '../../../utils/apiError.js'

const STATUS_COLOR = { SCHEDULED: 'green', COMPLETED: 'blue', CANCELLED: 'red' }

// A patient's past visits; prescription and reports each preview in a side drawer. `search`
// (from the page header) filters by appointment id.
export default function PatientHistoryTab({ patientId: externalId = null, search = '' }) {
  const [draft, setDraft] = useState(null)
  const [internalId, setInternalId] = useState(null)
  const [pdfFor, setPdfFor] = useState(null)
  const [reportsFor, setReportsFor] = useState(null)
  const patientId = externalId ?? internalId

  const { data, isFetching, isError, error } = usePatientHistory(patientId)
  const { data: allReports } = usePatientReports(patientId)
  const rows = (data ?? []).filter((r) => !search.trim() || String(r.id).includes(search.trim()))
  const visitReports = (allReports ?? []).filter((r) => r.appointmentId === reportsFor)

  const columns = [
    { title: 'AppointmentId', dataIndex: 'id', key: 'id', width: 130 },
    { title: 'Date', dataIndex: 'appointmentDate', key: 'appointmentDate' },
    { title: 'Time', key: 'time', render: (_, r) => `${r.startTime ?? '-'} – ${r.endTime ?? '-'}` },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s) => (s ? <Tag color={STATUS_COLOR[s] || 'default'}>{enumLabel(s)}</Tag> : '—'),
    },
    {
      title: 'Action', key: 'action', width: 300,
      render: (_, r) => (
        <Space size={4} wrap>
          <Button type="link" size="small" icon={<FilePdfOutlined />} onClick={() => setPdfFor(r.id)}>Prescription</Button>
          <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => setReportsFor(r.id)}>Reports</Button>
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {externalId == null && (
        <Space>
          <InputNumber min={1} placeholder="Patient ID" value={draft} onChange={setDraft}
            onPressEnter={() => setInternalId(draft)} />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => setInternalId(draft)}>Load visits</Button>
        </Space>
      )}

      {isError && <Typography.Text type="danger">{getErrorMessage(error)}</Typography.Text>}

      {patientId != null && (
        <Table rowKey="id" loading={isFetching} columns={columns} dataSource={rows}
          scroll={{ x: 720 }} pagination={false} />
      )}

      <Drawer title="Prescription" placement="right" width={680} open={pdfFor != null}
        onClose={() => setPdfFor(null)} destroyOnHidden>
        {pdfFor && (
          <PdfViewer url={`/appointments/${pdfFor}/consultation/pdf`}
            height="calc(100vh - 140px)" emptyText="No prescription recorded for this visit." />
        )}
      </Drawer>

      <Drawer title="Visit reports" placement="right" width={720} open={reportsFor != null}
        onClose={() => setReportsFor(null)} destroyOnHidden>
        <ReportsViewer reports={visitReports}
          fileUrl={(rid) => `/reports/${rid}/file`}
          height="calc(100vh - 200px)" />
      </Drawer>
    </Space>
  )
}
