import { Modal, Form, Input, Switch, Alert, Typography, App } from 'antd'
import { useCreateSetting, useUpdateSetting } from './settingsHooks.js'
import { getErrorMessage } from '../../utils/apiError.js'

// Add or edit one setting.
//
// Two rules the server enforces and this form has to respect:
//   - the NAME is never changed. Code looks settings up by it, so a rename would quietly
//     break whatever was reading it. Read-only when editing.
//   - a SECRET value is masked on the way out, so this form never holds the real one.
//     Leaving the box empty sends no value at all and keeps what is stored.
export default function SettingFormModal({ open, mode, initialValues, onClose }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const createMutation = useCreateSetting()
  const updateMutation = useUpdateSetting()
  const isEdit = mode === 'edit'
  const submitting = createMutation.isPending || updateMutation.isPending
  const editingSecret = isEdit && !!initialValues?.secret

  const handleOk = async () => {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    const typedValue = values.value?.trim() ?? ''
    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || null,
      secret: !!values.secret,
      enabled: !!values.enabled,
    }
    // Omitted, not blanked: the server reads a missing value as "keep the stored one".
    // Sending '' would wipe a key that this form was never shown.
    if (!editingSecret || typedValue) payload.value = typedValue

    const onError = (e) => message.error(getErrorMessage(e))

    if (isEdit) {
      updateMutation.mutate(
        { id: initialValues.id, payload },
        {
          onSuccess: () => {
            message.success('Setting updated')
            onClose()
          },
          onError,
        },
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          message.success('Setting created')
          onClose()
        },
        onError,
      })
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit setting' : 'Add setting'}
      okText={isEdit ? 'Save' : 'Create'}
      confirmLoading={submitting}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form
        // Keyed on the record, so opening a different row rebuilds the form rather than
        // showing the previous one's values.
        key={`${mode}-${initialValues?.id ?? 'new'}`}
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={{
          name: initialValues?.name ?? '',
          // A masked value must never be prefilled - saving it would store the mask.
          value: editingSecret ? '' : (initialValues?.value ?? ''),
          description: initialValues?.description ?? '',
          secret: initialValues?.secret ?? false,
          enabled: initialValues?.enabled ?? true,
        }}
      >
        <Form.Item
          name="name"
          label="Name"
          extra={
            isEdit
              ? 'The name cannot be changed - code looks this setting up by it.'
              : 'The key code reads it by, e.g. ai.show-sql'
          }
          rules={[
            { required: true, whitespace: true, message: 'Name is required' },
            { max: 150, message: 'Name must not exceed 150 characters' },
          ]}
        >
          <Input placeholder="e.g. ai.show-sql" disabled={isEdit} />
        </Form.Item>

        {editingSecret && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="This value is hidden"
            description={
              <>
                It is stored as <Typography.Text code>{initialValues?.value}</Typography.Text>{' '}
                here. Leave the box below empty to keep it, or type a new value to replace it.
              </>
            }
          />
        )}

        <Form.Item
          name="value"
          label="Value"
          rules={
            editingSecret
              ? []
              : [{ required: true, whitespace: true, message: 'Value is required' }]
          }
        >
          <Input.TextArea
            rows={2}
            placeholder={editingSecret ? 'Leave empty to keep the current value' : 'e.g. true'}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          extra="What this setting does, for whoever reads the list next."
          rules={[{ max: 500, message: 'Description must not exceed 500 characters' }]}
        >
          <Input.TextArea rows={2} placeholder="Optional description" />
        </Form.Item>

        <Form.Item
          name="secret"
          label="Secret"
          valuePropName="checked"
          extra="Hide the value everywhere it is sent to a browser. For keys and passwords."
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="enabled"
          label="Enabled"
          valuePropName="checked"
          extra="A disabled setting reads as absent, so the feature falls back to its default."
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}
