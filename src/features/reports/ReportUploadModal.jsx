import { useState } from 'react'
import { Modal, Form, Input, Upload, Button, Select, App } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useUploadReport } from './reportsHooks.js'
import { getOrderedTests } from './reportsApi.js'
import { usePatientAppointments } from '../patients/patientDetailHooks.js'
import { getErrorMessage } from '../../utils/apiError.js'

// Captures a title + a single PDF and posts them as multipart for the chosen patient.
export default function ReportUploadModal({ open, patientId, onClose }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [file, setFile] = useState(null)
  const uploadMutation = useUploadReport()
  const { data: visits } = usePatientAppointments(patientId, 1, 100)
  const appointmentId = Form.useWatch('appointmentId', form)

  // Offer the patient's visits so a report can be tied to one (optional).
  const appointmentOptions = (visits?.content ?? []).map((a) => ({
    value: a.id,
    label: `${a.appointmentDate ?? '—'} · ${a.doctorName ?? ''} · ${a.status ?? ''}`.trim(),
  }))

  // When a visit is chosen, offer its still-pending ordered tests to fulfil with this report.
  const { data: ordered } = useQuery({
    queryKey: ['reports', 'ordered-tests', appointmentId],
    queryFn: () => getOrderedTests(appointmentId),
    enabled: Boolean(appointmentId),
  })
  const orderedOptions = (ordered ?? [])
    .filter((t) => t.status === 'ORDERED')
    .map((t) => ({ value: t.id, label: `${t.testName} (${t.category})` }))

  const close = () => {
    form.resetFields()
    setFile(null)
    onClose()
  }

  // Keep the file in state instead of auto-uploading; accept a PDF or an image.
  const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const beforeUpload = (f) => {
    if (!ALLOWED.includes(f.type)) {
      message.error('Only PDF or image files are allowed')
      return Upload.LIST_IGNORE
    }
    setFile(f)
    return false
  }

  const handleSubmit = (values) => {
    if (!file) return message.error('Please select a PDF file')
    const formData = new FormData()
    formData.append('patientId', patientId)
    formData.append('title', values.title)
    if (values.appointmentId != null) formData.append('appointmentId', values.appointmentId)
    if (values.orderedTestId != null) formData.append('orderedTestId', values.orderedTestId)
    formData.append('file', file)
    uploadMutation.mutate(formData, {
      onSuccess: () => {
        message.success('Report uploaded')
        close()
      },
      onError: (e) => message.error(getErrorMessage(e)),
    })
  }

  return (
    <Modal
      open={open}
      title="Upload PDF Report"
      onCancel={close}
      onOk={() => form.submit()}
      confirmLoading={uploadMutation.isPending}
      okText="Upload"
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}>
          <Input placeholder="e.g. Blood test results" />
        </Form.Item>
        <Form.Item name="appointmentId" label="Link to appointment (optional)">
          <Select allowClear placeholder="Not linked to a visit" options={appointmentOptions} />
        </Form.Item>
        {appointmentId && orderedOptions.length > 0 && (
          <Form.Item name="orderedTestId" label="Fulfils ordered test (optional)">
            <Select allowClear placeholder="Mark an ordered test as available" options={orderedOptions} />
          </Form.Item>
        )}
        <Form.Item label="PDF or image file" required>
          <Upload accept=".pdf,image/*" maxCount={1} beforeUpload={beforeUpload} onRemove={() => setFile(null)}>
            <Button icon={<UploadOutlined />}>Select file</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  )
}
