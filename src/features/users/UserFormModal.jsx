import { Modal, Form, Input, Select, Switch, InputNumber, App } from 'antd'
import { useCreateUser, useUpdateUser } from './usersHooks.js'
import { useRoles } from '../roles/rolesHooks.js'
import { getErrorMessage } from '../../utils/apiError.js'

export default function UserFormModal({ open, mode, initialValues, onClose }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const { data: roles } = useRoles()
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const isEdit = mode === 'edit'
  const submitting = createMutation.isPending || updateMutation.isPending

  const roleOptions = (roles ?? []).map((r) => ({ label: r.name, value: r.id }))

  const handleOk = async () => {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    const onError = (e) => message.error(getErrorMessage(e))

    if (isEdit) {
      const payload = {
        roleId: values.roleId,
        enabled: values.enabled,
        doctorId: values.doctorId ?? null,
        patientId: values.patientId ?? null,
      }
      if (values.password) payload.password = values.password
      updateMutation.mutate(
        { id: initialValues.id, payload },
        {
          onSuccess: () => {
            message.success('User updated')
            onClose()
          },
          onError,
        },
      )
    } else {
      const payload = {
        username: values.username.trim(),
        password: values.password,
        roleId: values.roleId,
        enabled: values.enabled,
        doctorId: values.doctorId ?? null,
        patientId: values.patientId ?? null,
      }
      createMutation.mutate(payload, {
        onSuccess: () => {
          message.success('User created')
          onClose()
        },
        onError,
      })
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit user' : 'New user'}
      okText={isEdit ? 'Save' : 'Create'}
      confirmLoading={submitting}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form
        key={`${mode}-${initialValues?.id ?? 'new'}`}
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={{
          username: initialValues?.username ?? '',
          roleId: initialValues?.roleId ?? undefined,
          enabled: initialValues?.enabled ?? true,
          doctorId: initialValues?.doctorId ?? null,
          patientId: initialValues?.patientId ?? null,
        }}
      >
        <Form.Item
          name="username"
          label="Username"
          rules={[
            { required: true, whitespace: true, message: 'Username is required' },
            { max: 50, message: 'Username must not exceed 50 characters' },
          ]}
        >
          <Input placeholder="e.g. jsmith" disabled={isEdit} />
        </Form.Item>
        <Form.Item
          name="password"
          label={isEdit ? 'Password (leave blank to keep)' : 'Password'}
          rules={isEdit ? [] : [{ required: true, message: 'Password is required' }]}
        >
          <Input.Password placeholder={isEdit ? 'Unchanged' : 'Set a password'} />
        </Form.Item>
        <Form.Item
          name="roleId"
          label="Role"
          rules={[{ required: true, message: 'Role is required' }]}
        >
          <Select placeholder="Select a role" options={roleOptions} />
        </Form.Item>
        <Form.Item name="enabled" label="Enabled" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="doctorId" label="Doctor ID (optional)">
          <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="Link to a doctor" />
        </Form.Item>
        <Form.Item name="patientId" label="Patient ID (optional)">
          <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="Link to a patient" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
