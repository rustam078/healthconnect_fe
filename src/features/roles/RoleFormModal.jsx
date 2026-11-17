import { useEffect, useState } from 'react'
import { Modal, Form, Input, Select, Table, Checkbox, Spin, App } from 'antd'
import { useModules, useCreateRole, useUpdateRole } from './rolesHooks.js'
import { getErrorMessage } from '../../utils/apiError.js'

const DATA_SCOPE_OPTIONS = [
  { value: 'ALL', label: 'All records' },
  { value: 'DEPARTMENT', label: 'Own department' },
  { value: 'SELF', label: 'Own records only' },
]

// Turn a role's permission list into a { module: [actions] } lookup.
function toMatrix(permissions) {
  const map = {}
  for (const p of permissions ?? []) map[p.module] = [...(p.actions ?? [])]
  return map
}

export default function RoleFormModal({ open, mode, initialValues, onClose }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const { data: moduleData, isLoading } = useModules()
  const createMutation = useCreateRole()
  const updateMutation = useUpdateRole()
  const isEdit = mode === 'edit'
  const submitting = createMutation.isPending || updateMutation.isPending

  const modules = moduleData?.modules ?? []
  const actions = moduleData?.actions ?? []
  const [matrix, setMatrix] = useState({})

  // Reset name, description and the permission matrix whenever the modal opens.
  useEffect(() => {
    if (!open) return
    form.setFieldsValue({
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      dataScope: initialValues?.dataScope ?? 'SELF',
    })
    setMatrix(toMatrix(initialValues?.permissions))
  }, [open, initialValues, form])

  const isChecked = (module, action) => (matrix[module] ?? []).includes(action)

  const toggleCell = (module, action, checked) =>
    setMatrix((m) => {
      const current = new Set(m[module] ?? [])
      if (checked) current.add(action)
      else current.delete(action)
      return { ...m, [module]: [...current] }
    })

  const toggleRow = (module, checked) =>
    setMatrix((m) => ({ ...m, [module]: checked ? [...actions] : [] }))

  const handleOk = async () => {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    const permissions = modules
      .map((mod) => ({ module: mod.name, actions: matrix[mod.name] ?? [] }))
      .filter((p) => p.actions.length > 0)
    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || null,
      dataScope: values.dataScope,
      permissions,
    }
    const onError = (e) => message.error(getErrorMessage(e))

    if (isEdit) {
      updateMutation.mutate(
        { id: initialValues.id, payload },
        {
          onSuccess: () => {
            message.success('Role updated')
            onClose()
          },
          onError,
        },
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          message.success('Role created')
          onClose()
        },
        onError,
      })
    }
  }

  const columns = [
    {
      title: 'Module',
      dataIndex: 'label',
      key: 'label',
      render: (label, mod) => {
        const count = (matrix[mod.name] ?? []).length
        return (
          <Checkbox
            indeterminate={count > 0 && count < actions.length}
            checked={count === actions.length && count > 0}
            onChange={(e) => toggleRow(mod.name, e.target.checked)}
          >
            {label}
          </Checkbox>
        )
      },
    },
    ...actions.map((action) => ({
      title: action,
      key: action,
      width: 90,
      align: 'center',
      render: (_, mod) => (
        <Checkbox
          checked={isChecked(mod.name, action)}
          onChange={(e) => toggleCell(mod.name, action, e.target.checked)}
        />
      ),
    })),
  ]

  return (
    <Modal
      open={open}
      width={640}
      title={isEdit ? 'Edit role' : 'New role'}
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
            { required: true, whitespace: true, message: 'Name is required' },
            { max: 50, message: 'Name must not exceed 50 characters' },
          ]}
        >
          <Input placeholder="e.g. Receptionist" />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
          rules={[{ max: 255, message: 'Description must not exceed 255 characters' }]}
        >
          <Input.TextArea rows={2} placeholder="Optional description" />
        </Form.Item>
        <Form.Item
          name="dataScope"
          label="Data scope"
          rules={[{ required: true, message: 'Data scope is required' }]}
        >
          <Select options={DATA_SCOPE_OPTIONS} />
        </Form.Item>
      </Form>

      <Spin spinning={isLoading}>
        <Table
          rowKey="name"
          size="small"
          pagination={false}
          columns={columns}
          dataSource={modules}
          scroll={{ y: 320 }}
        />
      </Spin>
    </Modal>
  )
}
