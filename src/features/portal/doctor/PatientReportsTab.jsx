import { useState } from 'react'
import { InputNumber, Button, Table, Space, Typography, Drawer } from 'antd'
import { SearchOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { usePatientReports } from './doctorPortalHooks.js'
import PdfViewer from '../../../components/common/PdfViewer.jsx'
import { getErrorMessage } from '../../../utils/apiError.js'

// A patient's uploaded reports; each previews in a side drawer. `search` (from the page
// header) filters by appointment id.
export default function PatientReportsTab({ patientId: externalId = null, search = '' }) {
  const [draft, setDraft] = useState(null)
  const [internalId, setInternalId] = useState(null)
  const [preview, setPreview] = useState(null)
  const patientId = externalId ?? internalId

  const { data, isFetching, isError, error } = usePatientReports(patientId)
  const rows = (data ?? []).filter((r) => !search.trim() || String(r.appointmentId ?? '').includes(search.trim()))

  const columns = [
    { title: 'AppointmentId', dataIndex: 'appointmentId', key: 'appointmentId', width: 130, render: (v) => v ?? '—' },
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'File', dataIndex: 'originalFileName', key: 'originalFileName' },
    { title: 'Uploaded', dataIndex: 'createdAt', key: 'createdAt', render: (d) => (d ? dayjs(d).format('DD MMM YYYY') : '—') },
    {
      title: 'Action', key: 'action', width: 140,
      render: (_, r) => (
        <Button type="link" size="small" icon={<FilePdfOutlined />} onClick={() => setPreview(r)}>Preview</Button>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {externalId == null && (
        <Space>
          <InputNumber min={1} placeholder="Patient ID" value={draft} onChange={setDraft}
            onPressEnter={() => setInternalId(draft)} />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => setInternalId(draft)}>Load reports</Button>
        </Space>
      )}

      {isError && <Typography.Text type="danger">{getErrorMessage(error)}</Typography.Text>}

      {patientId != null && (
        <Table rowKey="id" loading={isFetching} columns={columns} dataSource={rows}
          scroll={{ x: 680 }} pagination={false} />
      )}

      <Drawer title={preview?.title || 'Report'} placement="right" width={680} open={preview != null}
        onClose={() => setPreview(null)} destroyOnHidden>
        {preview && patientId != null && (
          <PdfViewer url={`/doctor-portal/patients/${patientId}/reports/${preview.id}/file`}
            height="calc(100vh - 140px)" fileName={preview.originalFileName} />
        )}
      </Drawer>
    </Space>
  )
}
