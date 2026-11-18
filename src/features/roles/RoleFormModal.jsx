import { useEffect, useState } from 'react'
import { Drawer, Button, Space, Form, Input, Select, Table, Checkbox, Spin, Row, Col, App } from 'antd'
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

  // Reset the permission matrix whenever the drawer opens (name/scope come from Form initialValues).
  useEffect(() => {
    if (!open) return
    setMatrix(toMatrix(initialValues?.permissions))
  }, [open, initialValues])

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
      description: null,
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
    <Drawer
      open={open}
      width={640}
      title={isEdit ? 'Edit role' : 'New role'}
      onClose={onClose}
      destroyOnHidden
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" loading={submitting} onClick={handleOk}>
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </Space>
        </div>
      }
    >
      <Form
        key={`${mode}-${initialValues?.id ?? 'new'}`}
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={{
          name: initialValues?.name ?? '',
          dataScope: initialValues?.dataScope ?? 'SELF',
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
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
          </Col>
          <Col span={12}>
            <Form.Item
              name="dataScope"
              label="Data scope"
              rules={[{ required: true, message: 'Data scope is required' }]}
            >
              <Select options={DATA_SCOPE_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <Spin spinning={isLoading}>
        <Table
          rowKey="name"
          size="small"
          pagination={false}
          columns={columns}
          dataSource={modules}
          // scroll={{ y: 620 }}
        />
      </Spin>
    </Drawer>
  )
}
