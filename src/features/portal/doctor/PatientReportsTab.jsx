import { useState } from 'react'
import { InputNumber, Button, Table, Space, Typography } from 'antd'
import { SearchOutlined, FilePdfOutlined } from '@ant-design/icons'
import { usePatientReports } from './doctorPortalHooks.js'
import PdfModal from './PdfModal.jsx'
import { getErrorMessage } from '../../../utils/apiError.js'

// A patient's uploaded reports, each previewable inline. When a patientId prop is given
// (patient detail page) the lookup box is hidden and that patient is used directly.
export default function PatientReportsTab({ patientId: externalId = null }) {
  const [draft, setDraft] = useState(null)
  const [internalId, setInternalId] = useState(null)
  const [reportId, setReportId] = useState(null)
  const patientId = externalId ?? internalId

  const { data, isFetching, isError, error } = usePatientReports(patientId)
  const rows = data ?? []

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'File', dataIndex: 'originalFileName', key: 'originalFileName' },
    { title: 'Uploaded', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: 'Action',
      key: 'action',
      render: (_, r) => (
        <Button type="link" icon={<FilePdfOutlined />} onClick={() => setReportId(r.id)}>
          Preview
        </Button>
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
            Load reports
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
          scroll={{ x: 640 }}
          pagination={false}
        />
      )}

      <PdfModal
        title="Patient report"
        url={patientId != null && reportId ? `/doctor-portal/patients/${patientId}/reports/${reportId}/file` : null}
        open={reportId != null}
        onClose={() => setReportId(null)}
      />
    </Space>
  )
}
