import { useEffect } from 'react'
import { Form, Input, Select, Switch, Row, Col } from 'antd'
import { useRoles } from '../../features/roles/rolesHooks.js'

// Builds the optional `login` payload from validated form values (undefined when toggled off).
export function buildLoginPayload(values) {
  if (!values.createLogin) return undefined
  return {
    username: values.username.trim(),
    password: values.password,
    roleId: values.roleId,
  }
}

// "Create login account" toggle that reveals username, password and role (create forms only).
export default function LoginAccountFields({ form, defaultRoleName }) {
  const { data: roles } = useRoles()
  const enabled = Form.useWatch('createLogin', form)
  const email = Form.useWatch('email', form)

  // Suggest the email as username until the user edits it themselves.
  useEffect(() => {
    if (enabled && !form.isFieldTouched('username')) form.setFieldsValue({ username: email ?? '' })
  }, [enabled, email, form])

  // Default the role to the one matching this person type.
  useEffect(() => {
    if (!enabled || form.getFieldValue('roleId') != null) return
    const match = (roles ?? []).find((r) => r.name?.toUpperCase() === defaultRoleName)
    if (match) form.setFieldsValue({ roleId: match.id })
  }, [enabled, roles, defaultRoleName, form])

  return (
    <>
      <Form.Item name="createLogin" label="Create login account" valuePropName="checked">
        <Switch />
      </Form.Item>
      {enabled && (
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="username"
              label="Username"
              rules={[
                { required: true, whitespace: true, message: 'Username is required' },
                { max: 100, message: 'Must not exceed 100 characters' },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Password is required' }]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="roleId" label="Role" rules={[{ required: true, message: 'Role is required' }]}>
              <Select
                placeholder="Select role"
                options={(roles ?? []).map((r) => ({ value: r.id, label: r.name }))}
              />
            </Form.Item>
          </Col>
        </Row>
      )}
    </>
  )
}
