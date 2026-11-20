import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card, Tabs, Button, Form, Input, Segmented, Checkbox, Select, DatePicker, Table, Space, Row, Col,
  Typography, Tag, Empty, Drawer, App,
} from 'antd'
import {
  ArrowLeftOutlined, PrinterOutlined, SaveOutlined, CheckOutlined, PlusOutlined, MinusCircleOutlined,
  ThunderboltOutlined, EyeOutlined, DownloadOutlined,
  ExperimentOutlined, TeamOutlined, CalendarOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  useWorkspace, useConsultation, useSaveConsultation, useCompleteAppointment,
  useLabTests, useOrderTests, useOrderedTests, useAvailableSlots, useScheduleFollowUp,
  useDoctorSpecialties, useRefer,
} from './doctorPortalHooks.js'
import PdfModal from './PdfModal.jsx'
import PatientHistoryPanel from './PatientHistoryPanel.jsx'
import PdfViewer from '../../../components/common/PdfViewer.jsx'
import axiosClient from '../../../api/axiosClient.js'
import { getErrorMessage } from '../../../utils/apiError.js'

const EMPTY_MED = { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }
const MED_FIELDS = [
  { name: 'medicineName', placeholder: 'Medicine', required: true, flex: 1.4 },
  { name: 'dosage', placeholder: 'Dosage', flex: 1 },
  { name: 'frequency', placeholder: 'Frequency', flex: 1 },
  { name: 'duration', placeholder: 'Duration', flex: 1 },
  { name: 'instructions', placeholder: 'Instructions', flex: 1.4 },
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
  const { data: labTests } = useLabTests()
  const { data: orderedTests } = useOrderedTests(appointmentId)
  const orderTestsMut = useOrderTests()
  const [previewReport, setPreviewReport] = useState(null)

  // Follow-up + referral state
  const [fuDate, setFuDate] = useState(null)
  const [fuTime, setFuTime] = useState(undefined)
  const [fuReason, setFuReason] = useState('')
  const [referSpecialty, setReferSpecialty] = useState(undefined)
  const [referReason, setReferReason] = useState('')
  const { data: slots } = useAvailableSlots(fuDate ? fuDate.format('YYYY-MM-DD') : null)
  const { data: specialties } = useDoctorSpecialties()
  const scheduleFuMut = useScheduleFollowUp()
  const referMut = useRefer()
  const save = useSaveConsultation()
  const complete = useCompleteAppointment()

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
    chiefComplaint: ws?.reason?.trim() ? ws.reason : (consult?.chiefComplaint || 'Not provided'),
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

  const orderedNames = new Set((orderedTests ?? []).map((t) => t.testName))
  const filteredTests = (labTests ?? [])
    .filter((t) => t.name.toLowerCase().includes(testSearch.trim().toLowerCase()))
    .sort((a, b) => (orderedNames.has(a.name) ? 0 : 1) - (orderedNames.has(b.name) ? 0 : 1)
      || a.name.localeCompare(b.name))
  const toggleTest = (id, checked) =>
    setTestIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))

  const doScheduleFollowUp = () => {
    scheduleFuMut.mutate(
      { appointmentId, payload: { date: fuDate.format('YYYY-MM-DD'), startTime: fuTime, reason: fuReason || null } },
      {
        onSuccess: () => { message.success('Follow-up scheduled'); setFuDate(null); setFuTime(undefined); setFuReason('') },
        onError: (e) => message.error(getErrorMessage(e)),
      },
    )
  }

  const doRefer = () => {
    referMut.mutate(
      { appointmentId, payload: { specialtyId: referSpecialty, reason: referReason || null } },
      {
        onSuccess: () => { message.success('Referral recorded'); setReferSpecialty(undefined); setReferReason('') },
        onError: (e) => message.error(getErrorMessage(e)),
      },
    )
  }

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

  const ordered = orderedTests ?? []
  const testColumns = [
    { title: 'Test', dataIndex: 'testName', key: 'testName' },
    { title: 'Category', dataIndex: 'category', key: 'category', width: 110, render: (c) => (c === 'RADIOLOGY' ? 'Radiology' : 'Lab') },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 120,
      render: (s) => <Tag color={s === 'AVAILABLE' ? 'green' : 'orange'}>{s}</Tag>,
    },
    {
      title: 'Action', key: 'action', width: 210,
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
    <Row gutter={24}>
      {/* LEFT SIDE - 40% */}
      <Col xs={24} lg={10}>
        <div style={{ marginBottom: 16 }}>
          <Typography.Text strong>Reason for Visit</Typography.Text>
          <div style={{
            marginTop: 4,
            padding: '8px 12px',
            background: '#f5f8fa',
            borderRadius: 6,
            color: '#33413E'
          }}>
            {ws?.reason || 'Not provided by patient'}
          </div>
        </div>

        <Form.Item name="diagnosis" label="Diagnosis">
          <Input placeholder="Enter diagnosis" />
        </Form.Item>



        <Form.Item name="notes" label="Clinical Notes">
          <Input.TextArea
            rows={5}
            maxLength={2000}
            showCount
            placeholder="Enter clinical notes..."
          />
        </Form.Item>
      </Col>

      {/* RIGHT SIDE - 60% */}
      <Col xs={24} lg={14}>
        <Form.Item name="severity" label="Severity">
          <Segmented
            block
            options={SEVERITY.map((s) => ({
              label: s.charAt(0) + s.slice(1).toLowerCase(),
              value: s
            }))}
          />
        </Form.Item>

        <Form.List name="medicines">
          {(fields, { add, remove }) => (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {fields.map((field) => (
                <Card
                  key={field.key}
                  size="small"
                  style={{ background: '#fafafa' }}
                  bodyStyle={{ padding: '12px' }}
                >
                  <Row gutter={8} align="middle" wrap={false}>
                    {MED_FIELDS.map((m) => (
                      <Col flex="1" key={m.name} style={{ minWidth: 0 }}>
                        <Form.Item
                          name={[field.name, m.name]}
                          style={{ marginBottom: 0 }}
                          rules={m.required ? [
                            { required: true, whitespace: true, message: 'Required' }
                          ] : []}
                        >
                          <Input placeholder={m.placeholder} />
                        </Form.Item>
                      </Col>
                    ))}

                    {!readOnly && (
                      <Col flex="24px">
                        <MinusCircleOutlined
                          style={{ color: '#ff4d4f', cursor: 'pointer' }}
                          onClick={() => remove(field.name)}
                        />
                      </Col>
                    )}
                  </Row>
                </Card>
              ))}

              {!readOnly && (
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add(EMPTY_MED)}
                  block
                >
                  Add Medicine
                </Button>
              )}
            </Space>
          )}
        </Form.List>
      </Col>
    </Row>
  </Form>
)
  const testsTab = (
    <Table rowKey="id" size="small" pagination={false} columns={testColumns}
      dataSource={ordered} scroll={{ x: 560 }}
      locale={{ emptyText: 'No tests ordered for this appointment' }} />
  )

  const historyTab = ws?.patientId ? <PatientHistoryPanel patientId={ws.patientId} /> : <Empty description="Loading..." />

  const actionBody = {
    order: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
        <Input.Search placeholder="Search tests..." allowClear value={testSearch}
          onChange={(e) => setTestSearch(e.target.value)} />
        <div style={{ flex: 1, minHeight: 140, overflowY: 'auto', border: '1px solid #eee', borderRadius: 6, padding: 8 }}>
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            {filteredTests.map((t) => {
              const isOrdered = orderedNames.has(t.name)
              return (
                <Checkbox key={t.id} checked={isOrdered || testIds.includes(t.id)} disabled={isOrdered}
                  onChange={(e) => toggleTest(t.id, e.target.checked)}>
                  {t.name} <Tag>{t.category === 'RADIOLOGY' ? 'Radiology' : 'Lab'}</Tag>
                  {isOrdered && <Tag color="orange" style={{ marginLeft: 4 }}>ordered</Tag>}
                </Checkbox>
              )
            })}
            {filteredTests.length === 0 && <Typography.Text type="secondary">No tests found</Typography.Text>}
          </Space>
        </div>
        <Button type="primary" block loading={orderTestsMut.isPending} disabled={!testIds.length}
          onClick={orderSelected}>Order Selected Tests ({testIds.length})</Button>
      </div>
    ),
    followup: ws?.followUpScheduled ? (
      <Empty description="A follow-up is already scheduled for this visit." />
    ) : (
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        <DatePicker style={{ width: '100%' }} value={fuDate} format="DD MMM YYYY"
          onChange={(d) => { setFuDate(d); setFuTime(undefined) }}
          disabledDate={(d) => d && d < dayjs().startOf('day')} />
        <Select style={{ width: '100%' }} placeholder="Select time" value={fuTime} onChange={setFuTime}
          notFoundContent={fuDate ? 'No free slots' : 'Pick a date first'}
          options={(slots ?? []).map((s) => ({
            value: s,
            label: dayjs(`2000-01-01T${s}`).isValid() ? dayjs(`2000-01-01T${s}`).format('hh:mm A') : s,
          }))} />
        <Input.TextArea rows={2} placeholder="Reason (optional)" value={fuReason}
          onChange={(e) => setFuReason(e.target.value)} />
        <Button type="primary" block loading={scheduleFuMut.isPending} disabled={!fuDate || !fuTime}
          onClick={doScheduleFollowUp}>Schedule Follow-up</Button>
      </Space>
    ),
    refer: ws?.referred ? (
      <Empty description="This visit is already referred to a specialist." />
    ) : (
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        <Select style={{ width: '100%' }} showSearch optionFilterProp="label" placeholder="Select specialty"
          value={referSpecialty} onChange={setReferSpecialty}
          options={(specialties ?? []).map((s) => ({ value: s.id, label: s.name }))} />
        <Input.TextArea rows={3} placeholder="Reason" value={referReason}
          onChange={(e) => setReferReason(e.target.value)} />
        <Button type="primary" block loading={referMut.isPending} disabled={!referSpecialty}
          onClick={doRefer}>Refer to Specialist</Button>
      </Space>
    ),
  }[action]

  const actionCards = {
    order: { icon: <ExperimentOutlined />, title: 'Order Tests' },
    refer: { icon: <TeamOutlined />, title: 'Refer to Specialists' },
    followup: { icon: <CalendarOutlined />, title: 'Follow-up Appointment' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: 'calc(100vh / var(--ui-scale) - 120px)', overflow: 'hidden' }}>
      {/* Keep the tab bar + action buttons fixed; only the tab's content scrolls. */}
      {/* Only the tab content scrolls (so medicines can be added); the scrollbar is hidden. */}
      <style>{`
        .apptTabs { height: 100%; }
        .apptTabs > .ant-tabs-nav { margin-bottom: 12px; }
        .apptTabs .ant-tabs-body-holder { flex: 1; min-height: 0; overflow: hidden; }
        .apptTabs .ant-tabs-body,
        .apptTabs .ant-tabs-content,
        .apptTabs .ant-tabs-tabpane { height: 100%; }
        .apptTabs .tabScroll {
          height: 100%;
          overflow-y: auto;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .apptTabs .tabScroll::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
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

      <Row gutter={16} wrap={false} style={{ flex: 1, minHeight: 0 }}>
        <Col flex="auto" style={{ minWidth: 0, height: '100%' }}>
          <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            styles={{ body: { flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' } }}>
            <Tabs className="apptTabs" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
              activeKey={activeTab} onChange={setActiveTab} tabBarExtraContent={topButtons}
              items={[
                { key: 'consultation', label: 'Consultation', children: <div className="tabScroll">{consultationTab}</div> },
                { key: 'tests', label: 'Tests & Reports', children: <div className="tabScroll">{testsTab}</div> },
                { key: 'history', label: 'History', children: <div style={{ height: '100%' }}>{historyTab}</div> },
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
        url={showPdf ? `/appointments/${appointmentId}/consultation/pdf` : null} />

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
