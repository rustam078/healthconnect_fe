import { useState } from 'react'
import { Table, Button, Modal, Alert } from 'antd'
import { useMyReports } from './customerPortalHooks.js'
import { getErrorMessage } from '../../../utils/apiError.js'
import PdfViewer from '../../../components/common/PdfViewer.jsx'

export default function MyReportsTab() {
  const { data, isFetching, isError, error } = useMyReports()
  const [preview, setPreview] = useState(null)

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => (value ? value.slice(0, 10) : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button size="small" onClick={() => setPreview(record)}>
          Preview
        </Button>
      ),
    },
  ]

  return (
    <>
      {isError && <Alert type="error" message={getErrorMessage(error)} style={{ marginBottom: 12 }} />}
      <Table
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={data ?? []}
        pagination={false}
      />
      <Modal
        title={preview?.title}
        open={preview != null}
        onCancel={() => setPreview(null)}
        footer={null}
        width={760}
      >
        {preview && (
          <PdfViewer
            url={`/customer-portal/reports/${preview.id}/file`}
            fileName={preview.originalFileName || 'report.pdf'}
          />
        )}
      </Modal>
    </>
  )
}
