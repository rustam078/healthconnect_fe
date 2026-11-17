import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card, Tabs, Button, Form, Input, Segmented, Checkbox, Table, Space, Row, Col, Typography, Tag, Divider, Empty, App,
} from 'antd'
import {
  ArrowLeftOutlined, PrinterOutlined, SaveOutlined, CheckOutlined, PlusOutlined, MinusCircleOutlined,
  ThunderboltOutlined, EyeOutlined, DownloadOutlined,
  ExperimentOutlined, TeamOutlined, CalendarOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  useWorkspace, useConsultation, useSaveConsultation, useCompleteAppointment, usePatientReports,
  useLabTests, useOrderTests,
} from './doctorPortalHooks.js'
import PdfModal from './PdfModal.jsx'
import PatientHistoryPanel from './PatientHistoryPanel.jsx'
import axiosClient from '../../../api/axiosClient.js'
import { getErrorMessage } from '../../../utils/apiError.js'

const EMPTY_MED = { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }
const MED_FIELDS = [
  { name: 'medicineName', placeholder: 'Medicine', required: true, flex: 1.4 },
  { name: 'dosage', placeholder: 'Dosage', flex: 1 },
  { name: 'frequency', placeholder: 'Frequency', flex: 1 },
  { name: 'duration', placeholder: 'Duration', flex: 1 },
  { name: 'instructions', placeholder: 'Remarks', flex: 1.4 },
]
const SEVERITY = ['MILD', 'MODERATE', 'SEVERE']
const fmtDate = (d) => (d ? dayjs(d).format('DD MMM YYYY') : '—')

export default function DoctorAppointmentPage() {
  const { appointmentId: param } = useParams()
  const appointmentId = Number(param)
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('consultation')
  const [action, setAction] = useState('followup')
  const [showPdf, setShowPdf] = useState(false)
  const [testIds, setTestIds] = useState([])
  const [testSearch, setTestSearch] = useState('')

  const { data: ws } = useWorkspace(appointmentId)
  const { data: consult } = useConsultation(appointmentId, true)
  const { data: reports } = usePatientReports(ws?.patientId ?? null)
  const { data: labTests } = useLabTests()
  const orderTestsMut = useOrderTests()
  const [previewReport, setPreviewReport] = useState(null)
  const save = useSaveConsultation()
  const complete = useCompleteAppointment()

  const visitReports = (reports ?? []).filter((r) => r.appointmentId === appointmentId)
  const readOnly = ws?.status === 'COMPLETED'

  // Prefill from an existing consultation (draft or completed).
  useEffect(() => {
    form.setFieldsValue({
      chiefComplaint: consult?.chiefComplaint ?? '',
      severity: consult?.severity ?? undefined,
      diagnosis: consult?.diagnosis ?? '',
      notes: consult?.notes ?? '',
      medicines: consult?.medicines?.length ? consult.medicines : [EMPTY_MED],
    })
  }, [consult, form])

  const payloadFrom = (values) => ({
    chiefComplaint: values.chiefComplaint,
    severity: values.severity ?? null,
    diagnosis: values.diagnosis ?? null,
    notes: values.notes ?? null,
    medicines: (values.medicines ?? []).filter((m) => m?.medicineName?.trim()),
    tests: [],
  })

  const validate = async () => form.validateFields().then((v) => v).catch(() => null)

  const saveDraft = async () => {
    const values = await validate()
    if (!values) return
    save.mutate({ appointmentId, payload: payloadFrom(values) }, {
      onSuccess: () => message.success('Draft saved'),
      onError: (e) => message.error(getErrorMessage(e)),
    })
  }

  const completeConsultation = async () => {
    const values = await validate()
    if (!values) return
    save.mutate({ appointmentId, payload: payloadFrom(values) }, {
      onSuccess: () => complete.mutate(appointmentId, {
        onSuccess: () => { message.success('Consultation completed'); navigate('/doctor/schedule') },
        onError: (e) => message.error(getErrorMessage(e)),
      }),
      onError: (e) => message.error(getErrorMessage(e)),
    })
  }

  const orderSelected = () => {
    if (!testIds.length) return
    orderTestsMut.mutate({ appointmentId, labTestIds: testIds }, {
      onSuccess: () => { message.success('Tests ordered'); setTestIds([]) },
      onError: (e) => message.error(getErrorMessage(e)),
    })
  }

  const filteredTests = (labTests ?? []).filter((t) =>
    t.name.toLowerCase().includes(testSearch.trim().toLowerCase()))

  const reportFileUrl = (id) => `/doctor-portal/patients/${ws?.patientId}/reports/${id}/file`
  const typeLabel = (ct) => (ct?.includes('pdf') ? 'PDF' : ct?.startsWith('image') ? 'Image' : (ct || '—'))

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

  const reportColumns = [
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (d) => (d ? dayjs(d).format('DD MMM YYYY') : '—') },
    { title: 'Report Name', dataIndex: 'title', key: 'title' },
    { title: 'Type', dataIndex: 'contentType', key: 'contentType', width: 90, render: typeLabel },
    { title: 'Uploaded By', dataIndex: 'uploadedBy', key: 'uploadedBy', render: (u) => u || '—' },
    {
      title: 'Action',
      key: 'action',
      width: 200,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setPreviewReport(r)}>Preview</Button>
          <Button size="small" icon={<DownloadOutlined />} onClick={() => downloadReport(r)}>Download</Button>
        </Space>
      ),
    },
  ]

  const topButtons = activeTab === 'consultation' ? (
    <Space>
      <Button icon={<PrinterOutlined />} onClick={() => setShowPdf(true)}>Print Prescription</Button>
      {!readOnly && (
        <>
          <Button icon={<SaveOutlined />} onClick={saveDraft} loading={save.isPending}>Save Draft</Button>
          <Button type="primary" icon={<CheckOutlined />} loading={save.isPending || complete.isPending}
            onClick={completeConsultation}>Complete Consultation</Button>
        </>
      )}
    </Space>
  ) : null

  const consultationTab = (
    <Form form={form} layout="vertical" disabled={readOnly}>
      <Form.Item name="chiefComplaint" label="Chief Complaint"
        rules={[{ required: true, whitespace: true, message: 'Chief complaint is required' }]}>
        <Input.TextArea rows={3} maxLength={1000} showCount placeholder="Enter chief complaint (e.g. Fever, Cough, Body Pain...)" />
      </Form.Item>
      <Row gutter={16}>
        <Col xs={24} md={14}>
          <Form.Item name="diagnosis" label="Diagnosis">
            <Input placeholder="Enter diagnosis" />
          </Form.Item>
        </Col>
        <Col xs={24} md={10}>
          <Form.Item name="severity" label="Severity">
            <Segmented options={SEVERITY.map((s) => ({ label: s.charAt(0) + s.slice(1).toLowerCase(), value: s }))} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="notes" label="Clinical Notes">
        <Input.TextArea rows={3} maxLength={2000} showCount placeholder="Enter clinical notes..." />
      </Form.Item>

      <Divider orientation="left">Medicines &amp; Treatment</Divider>
      <Form.List name="medicines">
        {(fields, { add, remove }) => (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {fields.map((field) => (
              <Space key={field.key} align="baseline" style={{ display: 'flex' }} wrap>
                {MED_FIELDS.map((m) => (
                  <Form.Item key={m.name} name={[field.name, m.name]}
                    style={{ flex: m.flex, marginBottom: 0, minWidth: 120 }}
                    rules={m.required ? [{ required: true, whitespace: true, message: 'Required' }] : []}>
                    <Input placeholder={m.placeholder} />
                  </Form.Item>
                ))}
                {!readOnly && <MinusCircleOutlined onClick={() => remove(field.name)} />}
              </Space>
            ))}
            {!readOnly && (
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => add(EMPTY_MED)} block>Add Medicine</Button>
            )}
          </Space>
        )}
      </Form.List>
    </Form>
  )

  const testsTab = (
    <Table rowKey="id" size="small" pagination={false} columns={reportColumns}
      dataSource={visitReports} scroll={{ x: 640 }}
      locale={{ emptyText: 'No reports for this appointment' }} />
  )

  const historyTab = ws?.patientId ? <PatientHistoryPanel patientId={ws.patientId} /> : <Empty description="Loading..." />

  const actionBody = {
    order: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
        <Input.Search placeholder="Search tests..." allowClear value={testSearch}
          onChange={(e) => setTestSearch(e.target.value)} />
        <div style={{ flex: 1, minHeight: 140, overflowY: 'auto', border: '1px solid #eee', borderRadius: 6, padding: 8 }}>
          <Checkbox.Group value={testIds} onChange={setTestIds} style={{ width: '100%' }}>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {filteredTests.map((t) => (
                <Checkbox key={t.id} value={t.id}>
                  {t.name} <Tag>{t.category === 'RADIOLOGY' ? 'Radiology' : 'Lab'}</Tag>
                </Checkbox>
              ))}
              {filteredTests.length === 0 && <Typography.Text type="secondary">No tests found</Typography.Text>}
            </Space>
          </Checkbox.Group>
        </div>
        <Button type="primary" block loading={orderTestsMut.isPending} disabled={!testIds.length}
          onClick={orderSelected}>Order Selected Tests ({testIds.length})</Button>
      </div>
    ),
    refer: <Empty description="Coming in the next step" />,
    followup: <Empty description="Coming in the next step" />,
  }[action]

  const actionCards = {
    order: { icon: <ExperimentOutlined />, title: 'Order Tests' },
    refer: { icon: <TeamOutlined />, title: 'Refer to Specialists' },
    followup: { icon: <CalendarOutlined />, title: 'Follow-up Appointment' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: 'calc(100vh / var(--ui-scale) - 120px)' }}>
      {/* Keep the tab bar + action buttons fixed; only the tab's content scrolls. */}
      {/* Only the tab content scrolls (so medicines can be added); the scrollbar is hidden. */}
      <style>{`
        .apptTabs { height: 100%; }
        .apptTabs > .ant-tabs-nav { margin-bottom: 12px; }
        .apptTabs .ant-tabs-content-holder,
        .apptTabs .ant-tabs-tabpane {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .apptTabs .ant-tabs-content-holder { flex: 1; overflow-y: auto; min-height: 0; }
        .apptTabs .ant-tabs-content-holder::-webkit-scrollbar,
        .apptTabs .ant-tabs-tabpane::-webkit-scrollbar {
          width: 0 !important;
          height: 0 !important;
          display: none !important;
        }
      `}</style>
      <Card styles={{ body: { padding: 16 } }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space align="center" size={16}>
              <Typography.Title level={4} style={{ margin: 0 }}>{ws?.patientName ?? 'Patient'}</Typography.Title>
              {ws?.status && <Tag color={ws.status === 'COMPLETED' ? 'blue' : 'green'}>{ws.status}</Tag>}
            </Space>
            <div style={{ color: '#7C8B87', marginTop: 4 }}>
              Patient ID: {ws?.patientCode ?? '—'} &nbsp;|&nbsp; Age: {ws?.age ?? '—'} / {ws?.gender ?? '—'}
              &nbsp;|&nbsp; Phone: {ws?.phone ?? '—'}
            </div>
          </Col>
          <Col>
            <Space size={24}>
              <span><div style={{ fontSize: 12, color: '#7C8B87' }}>Last Visit</div>{fmtDate(ws?.lastVisitDate)}</span>
              <span><div style={{ fontSize: 12, color: '#7C8B87' }}>Next Follow-up</div>{fmtDate(ws?.nextFollowUpDate)}</span>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/doctor/schedule')}>Back</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ flex: 1, minHeight: 0 }}>
        <Col flex="auto" style={{ minWidth: 0, height: '100%' }}>
          <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            styles={{ body: { flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' } }}>
            <Tabs className="apptTabs" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
              activeKey={activeTab} onChange={setActiveTab} tabBarExtraContent={topButtons}
              items={[
                { key: 'consultation', label: 'Consultation', children: consultationTab },
                { key: 'tests', label: 'Tests & Reports', children: testsTab },
                { key: 'history', label: 'History', children: historyTab },
              ]} />
          </Card>
        </Col>
        {activeTab === 'consultation' && (
          <Col flex="320px" style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
              <Card size="small" title={<Space><ThunderboltOutlined />Quick Actions</Space>}>
                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                  {Object.entries(actionCards).map(([key, a]) => (
                    <Button key={key} block icon={a.icon} type={action === key ? 'primary' : 'default'}
                      onClick={() => setAction(key)}>{a.title}</Button>
                  ))}
                </Space>
              </Card>
              <Card size="small" title={actionCards[action].title}
                style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
                styles={{ body: { flex: 1, overflow: 'auto', minHeight: 0 } }}>
                {actionBody}
              </Card>
            </div>
          </Col>
        )}
      </Row>

      <PdfModal title="Prescription" open={showPdf} onClose={() => setShowPdf(false)}
        url={showPdf ? `/doctor-portal/appointments/${appointmentId}/consultation/pdf` : null} />

      <PdfModal title={previewReport?.title || 'Report'} open={Boolean(previewReport)}
        onClose={() => setPreviewReport(null)}
        url={previewReport ? reportFileUrl(previewReport.id) : null} />
    </div>
  )
}
