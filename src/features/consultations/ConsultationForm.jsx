import { Form, Input, Button, Space, Divider, Typography, App } from 'antd'
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { useCreateConsultation } from './consultationHooks.js'
import { getErrorMessage } from '../../utils/apiError.js'

const { TextArea } = Input

// Records a visit against a live appointment: complaint, diagnosis, notes and any number of
// prescribed medicines. Saving also completes the appointment (the backend does both in one
// transaction), so onDone is the caller's cue that the visit is closed.
export default function ConsultationForm({ appointmentId, onDone, onCancel }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const create = useCreateConsultation()

  const handleSave = async () => {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    create.mutate(
      {
        appointmentId,
        chiefComplaint: values.chiefComplaint,
        diagnosis: values.diagnosis,
        notes: values.notes,
        medicines: values.medicines ?? [],
      },
      {
        onSuccess: () => {
          message.success('Consultation recorded')
          onDone()
        },
        onError: (e) => message.error(getErrorMessage(e)),
      },
    )
  }

  return (
    <>
      <Divider orientation="left" orientationMargin={0}>
        Record consultation
      </Divider>
      <Typography.Text type="secondary">
        This records the visit. Marking the appointment completed is a separate step.
      </Typography.Text>

      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item
          name="chiefComplaint"
          label="Chief complaint"
          rules={[{ required: true, message: 'What did the patient come in with?' }]}
        >
          <TextArea rows={2} placeholder="e.g. Fever and headache for 3 days" />
        </Form.Item>

        <Form.Item name="diagnosis" label="Diagnosis">
          <TextArea rows={2} placeholder="e.g. Viral fever" />
        </Form.Item>

        <Form.Item name="notes" label="Notes / advice">
          <TextArea rows={2} placeholder="Follow-up advice, observations…" />
        </Form.Item>

        <Divider orientation="left" orientationMargin={0}>
          Prescription
        </Divider>

        <Form.List name="medicines">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...rest }) => (
                <Space
                  key={key}
                  align="baseline"
                  style={{ display: 'flex', marginBottom: 8 }}
                >
                  <Form.Item
                    {...rest}
                    name={[name, 'medicineName']}
                    rules={[{ required: true, message: 'Medicine name' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="Medicine" style={{ width: 150 }} />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'dosage']} style={{ marginBottom: 0 }}>
                    <Input placeholder="500mg" style={{ width: 90 }} />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'frequency']} style={{ marginBottom: 0 }}>
                    <Input placeholder="1-0-1" style={{ width: 90 }} />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'duration']} style={{ marginBottom: 0 }}>
                    <Input placeholder="5 days" style={{ width: 90 }} />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'instructions']} style={{ marginBottom: 0 }}>
                    <Input placeholder="after food" style={{ width: 130 }} />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item style={{ marginTop: 4 }}>
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                  Add medicine
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Space>
          <Button type="primary" loading={create.isPending} onClick={handleSave}>
            Save consultation
          </Button>
          <Button onClick={onCancel}>Discard</Button>
        </Space>
      </Form>
    </>
  )
}
