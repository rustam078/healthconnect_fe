import { useState } from 'react'
import { Modal, Form, Input, Upload, Button, Select, App } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { useUploadReport } from './reportsHooks.js'
import { usePatientAppointments } from '../patients/patientDetailHooks.js'
import { getErrorMessage } from '../../utils/apiError.js'

// Captures a title + a single PDF and posts them as multipart for the chosen patient.
export default function ReportUploadModal({ open, patientId, onClose }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [file, setFile] = useState(null)
  const uploadMutation = useUploadReport()
  const { data: visits } = usePatientAppointments(patientId, 1, 100)

  // Offer the patient's visits so a report can be tied to one (optional).
  const appointmentOptions = (visits?.content ?? []).map((a) => ({
    value: a.id,
    label: `${a.appointmentDate ?? '—'} · ${a.doctorName ?? ''} · ${a.status ?? ''}`.trim(),
  }))

  const close = () => {
    form.resetFields()
    setFile(null)
    onClose()
  }

  // Keep the file in state instead of auto-uploading; only accept PDFs.
  const beforeUpload = (f) => {
    if (f.type !== 'application/pdf') {
      message.error('Only PDF files are allowed')
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
        <Form.Item label="PDF file" required>
          <Upload accept="application/pdf" maxCount={1} beforeUpload={beforeUpload} onRemove={() => setFile(null)}>
            <Button icon={<UploadOutlined />}>Select PDF</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  )
}
