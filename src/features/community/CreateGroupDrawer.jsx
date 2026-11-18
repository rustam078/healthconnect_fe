import { Drawer, Form, Input, Segmented, Select, Button, Space, Typography, App } from 'antd'
import { useCreateCommunity } from './communityHooks.js'
import { useUsers } from '../users/usersHooks.js'
import { VISIBILITY } from './communityMeta.jsx'
import { getErrorMessage } from '../../utils/apiError.js'

// Admin creates a group here (a side drawer, not a modal). Patients can never be added as members.
export default function CreateGroupDrawer({ open, onClose, onCreated }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const create = useCreateCommunity()
  const { data: users } = useUsers()

  const memberOptions = (users ?? [])
    .filter((u) => u.patientId == null && (u.role ?? '').toUpperCase() !== 'CUSTOMER')
    .map((u) => ({ value: u.id, label: u.username }))

  const handleOk = async () => {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    create.mutate(
      { ...values, name: values.name.trim(), memberIds: values.memberIds ?? [] },
      {
        onSuccess: (data) => {
          message.success('Group created')
          form.resetFields()
          onCreated?.(data)
          onClose()
        },
        onError: (e) => message.error(getErrorMessage(e)),
      },
    )
  }

  return (
    <Drawer
      open={open}
      width={440}
      title="New group"
      onClose={onClose}
      destroyOnHidden
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" loading={create.isPending} onClick={handleOk}>
              Create
            </Button>
          </Space>
        </div>
      }
    >
      <Form form={form} layout="vertical" preserve={false} initialValues={{ visibility: 'PUBLIC_DOCTORS' }}>
        <Form.Item name="name" label="Group name"
          rules={[{ required: true, whitespace: true, message: 'Name is required' }, { max: 120 }]}>
          <Input placeholder="e.g. Cardiology Team" />
        </Form.Item>
        <Form.Item name="description" label="Description" rules={[{ max: 500 }]}>
          <Input.TextArea rows={2} placeholder="What is this group about?" />
        </Form.Item>
        <Form.Item name="visibility" label="Visibility">
          <Segmented
            block
            options={Object.entries(VISIBILITY).map(([value, m]) => ({
              value,
              label: (
                <Space size={6}>
                  {m.icon}
                  {m.label}
                </Space>
              ),
            }))}
          />
        </Form.Item>
        <Form.Item shouldUpdate noStyle>
          {() => (
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: -8, marginBottom: 14, fontSize: 12 }}>
              {VISIBILITY[form.getFieldValue('visibility')]?.hint}
            </Typography.Text>
          )}
        </Form.Item>
        <Form.Item name="memberIds" label="Add members (optional)">
          <Select mode="multiple" allowClear placeholder="Doctors / staff — patients excluded"
            optionFilterProp="label" options={memberOptions} maxTagCount="responsive" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
