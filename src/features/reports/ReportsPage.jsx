import { useState } from 'react'
import { Card, Table, Button, Space, Typography, Tag, Input, Row, Col, Drawer, Upload, Popconfirm, App } from 'antd'
import { EyeOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  useLabOrders, useUploadReportForTest, useRemoveReportFromTest, useDeleteOrderedTest,
} from './reportsHooks.js'
import PdfViewer from '../../components/common/PdfViewer.jsx'
import { getErrorMessage } from '../../utils/apiError.js'

const PAGE_SIZE = 10

// Admin lab reports: every appointment with lab orders. Expand a row to upload / preview /
// remove each test's report, or delete a test the patient no longer wants.
export default function ReportsPage() {
  const { message } = App.useApp()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [preview, setPreview] = useState(null)
  const [expandedKey, setExpandedKey] = useState(null)

  const idFilter = search.trim() && !Number.isNaN(Number(search.trim())) ? Number(search.trim()) : null
  const { data, isFetching } = useLabOrders({ appointmentId: idFilter, page, size: PAGE_SIZE })
  const rows = data?.content ?? []
  const total = data?.totalElements ?? 0

  const upload = useUploadReportForTest()
  const removeReport = useRemoveReportFromTest()
  const deleteTest = useDeleteOrderedTest()

  const doUpload = (t, file) => {
    const fd = new FormData()
    fd.append('file', file)
    upload.mutate({ orderedTestId: t.orderedTestId, formData: fd }, {
      onSuccess: () => message.success('Report uploaded'),
      onError: (e) => message.error(getErrorMessage(e)),
    })
  }
  const doRemoveReport = (t) => removeReport.mutate(t.orderedTestId, {
    onSuccess: () => { message.success('Report removed'); setPreview(null) },
    onError: (e) => message.error(getErrorMessage(e)),
  })
  const doDeleteTest = (t) => deleteTest.mutate(t.orderedTestId, {
    onSuccess: () => message.success('Ordered test deleted'),
    onError: (e) => message.error(getErrorMessage(e)),
  })

  const testColumns = [
    { title: 'Test', dataIndex: 'testName', key: 'testName' },
    { title: 'Category', dataIndex: 'category', key: 'category', width: 110, render: (c) => (c === 'RADIOLOGY' ? 'Radiology' : 'Lab') },
    { title: 'File', dataIndex: 'report', key: 'file', render: (r) => r?.originalFileName || '—' },
    { title: 'Status', dataIndex: 'labStatus', key: 'labStatus', width: 110, render: (s) => <Tag color={s === 'AVAILABLE' ? 'green' : 'orange'}>{s}</Tag> },
    {
      title: 'Action', key: 'action', width: 320,
      render: (_, t) => (
        <Space size={4} wrap>
          {t.labStatus === 'AVAILABLE' ? (
            <>
              <Button size="small" icon={<EyeOutlined />} onClick={() => setPreview(t)}>Preview</Button>
            </>
          ) : (
            <Upload showUploadList={false} accept=".pdf,image/*"
              beforeUpload={(f) => { doUpload(t, f); return false }}>
              <Button size="small" icon={<UploadOutlined />}>Upload</Button>
            </Upload>
          )}
          <Popconfirm title="Delete this test? (patient does not want it)" onConfirm={() => doDeleteTest(t)}>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const columns = [
    { title: 'AppointmentId', dataIndex: 'appointmentId', key: 'appointmentId', width: 130 },
    { title: 'Patient', dataIndex: 'patientName', key: 'patientName' },
    { title: 'Date', dataIndex: 'appointmentDate', key: 'appointmentDate', render: (d) => (d ? dayjs(d).format('DD MMM YYYY') : '—') },
    { title: 'Age', dataIndex: 'age', key: 'age', width: 70 },
    { title: 'Gender', dataIndex: 'gender', key: 'gender', width: 90, render: (v) => v || '—' },
    { title: 'Blood', dataIndex: 'bloodGroup', key: 'bloodGroup', width: 90, render: (v) => v || '—' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (s) => <Tag color={s === 'ORDERED' ? 'orange' : 'green'}>{s}</Tag> },
  ]

  return (
    <Card>
      {/* <style>{`
        .innerLabTable .ant-table-thead > tr > th { background: #e6f4f1 !important; color: #09acc9;border-radius: 0 !important; }
        .ant-table-expanded-row > .ant-table-cell { background: #fafafa; }
      `}</style> */}

      <style>{`
  /* Expanded row cell spacing */
  .ant-table-expanded-row > td.ant-table-cell {
    padding: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    background: #fafafa;
  }

  /* Inner table wrapper */
  .innerLabTable {
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Actual inner ant table */
  .innerLabTable .ant-table {
    margin: 0 !important;
    padding: 0 !important;
    border-radius: 0 !important;
  }

  /* Remove inner table border radius */
  .innerLabTable .ant-table-container,
  .innerLabTable .ant-table-content,
  .innerLabTable table {
    border-radius: 0 !important;
  }

  /* Inner table header */
  .innerLabTable .ant-table-thead > tr > th {
    background: #e6f4f1 !important;
    color: #09acc9;
    border-radius: 0 !important;
  }
`}</style>
      
      <Row justify="space-between" align="middle" gutter={[8, 8]} wrap style={{ marginBottom: 12 }}>
        <Col><Typography.Title level={4} style={{ margin: 0 }}>Lab Reports</Typography.Title></Col>
        <Col>
          <Input.Search placeholder="Search by Appointment ID" allowClear value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }} style={{ width: 240 }} />
        </Col>
      </Row>

      <Table
        rowKey="appointmentId"
        loading={isFetching}
        columns={columns}
        dataSource={rows}
        scroll={{ x: 820 }}
        expandable={{
          expandedRowKeys: expandedKey != null ? [expandedKey] : [],
          onExpand: (expanded, record) => setExpandedKey(expanded ? record.appointmentId : null),
          expandedRowRender: (record) => (
            <Table className="innerLabTable" rowKey="orderedTestId" pagination={false} style={{ width: '100%' }}
              columns={testColumns} dataSource={record.labOrders ?? []} />
          ),
        }}
        pagination={{ current: page, pageSize: PAGE_SIZE, total, onChange: setPage, showSizeChanger: false }}
      />

      <Drawer title={preview?.testName || 'Report'} placement="right" width={680} open={preview != null}
        onClose={() => setPreview(null)} destroyOnHidden
        extra={preview && (
          <Popconfirm title="Remove this report to re-upload?" onConfirm={() => doRemoveReport(preview)}>
            <Button danger size="small">Remove</Button>
          </Popconfirm>
        )}>
        {preview?.reportId && (
          <PdfViewer url={`/reports/${preview.reportId}/file`} height="calc(100vh - 140px)"
            fileName={preview?.report?.originalFileName} />
        )}
      </Drawer>
    </Card>
  )
}
