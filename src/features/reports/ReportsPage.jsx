import { useMemo, useState } from 'react'
import { Card, Select, Table, Button, Space, Typography, Modal, Empty } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { usePatients } from '../patients/patientsHooks.js'
import { useReports } from './reportsHooks.js'
import Can from '../auth/Can.jsx'
import PdfViewer from '../../components/common/PdfViewer.jsx'
import { getErrorMessage } from '../../utils/apiError.js'
import ReportUploadModal from './ReportUploadModal.jsx'

export default function ReportsPage() {
  const [search, setSearch] = useState('')
  const [patientId, setPatientId] = useState(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [preview, setPreview] = useState(null)

  const { data: patientPage, isFetching: patientsLoading } = usePatients({ search, page: 1, size: 20 })
  const { data: reports = [], isFetching, isError, error } = useReports(patientId)

  const patientOptions = useMemo(
    () =>
      (patientPage?.content ?? []).map((p) => ({
        value: p.id,
        label: `${p.firstName} ${p.lastName} (${p.patientCode})`,
      })),
    [patientPage],
  )

  const columns = [
    { title: 'Title', dataIndex: 'title' },
    { title: 'File name', dataIndex: 'originalFileName' },
    {
      title: 'Uploaded',
      dataIndex: 'createdAt',
      render: (v) => (v ? new Date(v).toLocaleString() : '—'),
    },
    {
      title: 'Action',
      width: 120,
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => setPreview(record)}>
          Preview
        </Button>
      ),
    },
  ]

  return (
    <Card>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Reports
        </Typography.Title>
        <Space>
          <Select
            showSearch
            allowClear
            placeholder="Search a patient"
            style={{ width: 300 }}
            filterOption={false}
            loading={patientsLoading}
            onSearch={setSearch}
            onChange={setPatientId}
            options={patientOptions}
            notFoundContent={null}
          />
          {patientId && (
            <Can module="REPORTS" action="CREATE">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadOpen(true)}>
                Upload PDF
              </Button>
            </Can>
          )}
        </Space>
      </Space>

      {isError && <Typography.Text type="danger">{getErrorMessage(error)}</Typography.Text>}

      {patientId ? (
        <Table rowKey="id" loading={isFetching} columns={columns} dataSource={reports} />
      ) : (
        <Empty description="Select a patient to view their reports" />
      )}

      <ReportUploadModal open={uploadOpen} patientId={patientId} onClose={() => setUploadOpen(false)} />

      <Modal
        open={!!preview}
        title={preview?.title}
        onCancel={() => setPreview(null)}
        footer={null}
        width={900}
        destroyOnHidden
      >
        {preview && (
          <PdfViewer url={`/reports/${preview.id}/file`} fileName={preview.originalFileName} />
        )}
      </Modal>
    </Card>
  )
}
