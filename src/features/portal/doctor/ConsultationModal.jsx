import { useEffect, useState } from 'react'
import { Modal, Form, Input, Button, Space, Divider, Spin, Typography, App } from 'antd'
import { PlusOutlined, MinusCircleOutlined, FilePdfOutlined } from '@ant-design/icons'
import { useConsultation, useSaveConsultation } from './doctorPortalHooks.js'
import PdfViewer from '../../../components/common/PdfViewer.jsx'
import { getErrorMessage } from '../../../utils/apiError.js'

const EMPTY_MED = { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }

const MED_FIELDS = [
  { name: 'medicineName', placeholder: 'Medicine', required: true, flex: 1.4 },
  { name: 'dosage', placeholder: 'Dosage', flex: 1 },
  { name: 'frequency', placeholder: 'Frequency', flex: 1 },
  { name: 'duration', placeholder: 'Duration', flex: 1 },
  { name: 'instructions', placeholder: 'Instructions', flex: 1.4 },
]

const EMPTY_TEST = { testName: '', instructions: '' }

const TEST_FIELDS = [
  { name: 'testName', placeholder: 'Test / investigation', required: true, flex: 1.4 },
  { name: 'instructions', placeholder: 'Instructions / note', flex: 1.6 },
]

// Write or edit a visit's prescription; pre-fills from an existing consultation when one exists.
export default function ConsultationModal({ appointment, open, onClose }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [showPdf, setShowPdf] = useState(false)
  const appointmentId = appointment?.id
  const { data, isLoading, error } = useConsultation(appointmentId, open)
  const saveMutation = useSaveConsultation()

  // Seed the form once the existing consultation resolves (or stays empty on a 404).
  useEffect(() => {
    if (!open) return
    const medicines = data?.medicines?.length ? data.medicines : [EMPTY_MED]
    form.setFieldsValue({
      chiefComplaint: data?.chiefComplaint ?? '',
      diagnosis: data?.diagnosis ?? '',
      notes: data?.notes ?? '',
      medicines,
      tests: data?.tests?.length ? data.tests : [],
    })
  }, [open, data, form])

  const handleClose = () => {
    setShowPdf(false)
    onClose()
  }

  const handleOk = async () => {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    saveMutation.mutate(
      { appointmentId, payload: values },
      {
        onSuccess: () => message.success('Prescription saved'),
        onError: (e) => message.error(getErrorMessage(e)),
      },
    )
  }

  const loadFailed = error && error.status !== 404

  return (
    <Modal
      title={appointment ? `Prescription — ${appointment.patientName}` : 'Prescription'}
      open={open}
      width={860}
      okText="Save"
      confirmLoading={saveMutation.isPending}
      onOk={handleOk}
      onCancel={handleClose}
      destroyOnHidden
    >
      {isLoading ? (
        <Spin />
      ) : (
        <Form form={form} layout="vertical" preserve={false}>
          {loadFailed && (
            <Typography.Text type="danger">{getErrorMessage(error)}</Typography.Text>
          )}
          <Form.Item name="chiefComplaint" label="Reason for Visit">
            <Input.TextArea rows={2} placeholder="e.g. Persistent cough for 5 days" />
          </Form.Item>
          <Form.Item name="diagnosis" label="Diagnosis">
            <Input.TextArea rows={2} placeholder="e.g. Acute bronchitis" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Advice, follow-up, etc." />
          </Form.Item>

          <Divider orientation="left">Medicines</Divider>
          <Form.List name="medicines">
            {(fields, { add, remove }) => (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {fields.map((field) => (
                  <Space key={field.key} align="baseline" style={{ display: 'flex' }} wrap>
                    {MED_FIELDS.map((m) => (
                      <Form.Item
                        key={m.name}
                        name={[field.name, m.name]}
                        style={{ flex: m.flex, marginBottom: 0, minWidth: 120 }}
                        rules={m.required ? [{ required: true, whitespace: true, message: 'Required' }] : []}
                      >
                        <Input placeholder={m.placeholder} />
                      </Form.Item>
                    ))}
                    <MinusCircleOutlined onClick={() => remove(field.name)} />
                  </Space>
                ))}
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => add(EMPTY_MED)} block>
                  Add medicine
                </Button>
              </Space>
            )}
          </Form.List>

          <Divider orientation="left">Advised tests</Divider>
          <Form.List name="tests">
            {(fields, { add, remove }) => (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {fields.map((field) => (
                  <Space key={field.key} align="baseline" style={{ display: 'flex' }} wrap>
                    {TEST_FIELDS.map((t) => (
                      <Form.Item
                        key={t.name}
                        name={[field.name, t.name]}
                        style={{ flex: t.flex, marginBottom: 0, minWidth: 160 }}
                        rules={t.required ? [{ required: true, whitespace: true, message: 'Required' }] : []}
                      >
                        <Input placeholder={t.placeholder} />
                      </Form.Item>
                    ))}
                    <MinusCircleOutlined onClick={() => remove(field.name)} />
                  </Space>
                ))}
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => add(EMPTY_TEST)} block>
                  Add test
                </Button>
              </Space>
            )}
          </Form.List>

          <Divider />
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => setShowPdf((v) => !v)}
            disabled={!appointmentId}
          >
            {showPdf ? 'Hide PDF' : 'View PDF'}
          </Button>
          {showPdf && appointmentId && (
            <div style={{ marginTop: 12 }}>
              <PdfViewer url={`/doctor-portal/appointments/${appointmentId}/consultation/pdf`} />
            </div>
          )}
        </Form>
      )}
    </Modal>
  )
}
