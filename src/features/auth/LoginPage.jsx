import { Card, Form, Input, Button, Typography, Alert } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useLogin } from './authHooks.js'
import { getErrorMessage } from '../../utils/apiError.js'
import { BRAND } from '../../app/theme.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const { mutate, isPending, isError, error } = useLogin()

  const handleFinish = (values) => {
    mutate(values, { onSuccess: () => navigate('/', { replace: true }) })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: BRAND.pageBg,
        padding: 16,
      }}
    >
      <Card style={{ width: 380 }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          HealthConnect
        </Typography.Title>

        {isError && (
          <Alert
            type="error"
            showIcon
            message={getErrorMessage(error)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form layout="vertical" onFinish={handleFinish} requiredMark={false}>
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Username is required' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" autoComplete="username" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              autoComplete="current-password"
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={isPending}>
            Sign in
          </Button>
        </Form>
      </Card>
    </div>
  )
}
