import { useEffect } from 'react'
import { Modal, Form, Input, App } from 'antd'
import { useCreateSpecialty, useUpdateSpecialty } from './specialtiesHooks.js'
import { getErrorMessage } from '../../utils/apiError.js'

export default function SpecialtyFormModal({ open, mode, initialValues, onClose }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const createMutation = useCreateSpecialty()
  const updateMutation = useUpdateSpecialty()
  const isEdit = mode === 'edit'
  const submitting = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: initialValues?.name ?? '',
        description: initialValues?.description ?? '',
      })
    }
  }, [open, initialValues, form])

  const handleOk = async () => {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    const payload = { name: values.name.trim(), description: values.description?.trim() || null }
    const onError = (e) => message.error(getErrorMessage(e))

    if (isEdit) {
      updateMutation.mutate(
        { id: initialValues.id, payload },
        {
          onSuccess: () => {
            message.success('Specialty updated')
            onClose()
          },
          onError,
        },
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          message.success('Specialty created')
          onClose()
        },
        onError,
      })
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit Specialty' : 'Add Specialty'}
      okText={isEdit ? 'Save' : 'Create'}
      confirmLoading={submitting}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="name"
          label="Name"
          rules={[
            { required: true, message: 'Name is required' },
            { max: 100, message: 'Name must not exceed 100 characters' },
          ]}
        >
          <Input placeholder="e.g. Cardiology" />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
          rules={[{ max: 500, message: 'Description must not exceed 500 characters' }]}
        >
          <Input.TextArea rows={3} placeholder="Optional description" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
