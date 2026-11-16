import { Spin } from 'antd'
import { useBootstrapAuth } from '../features/auth/authHooks.js'

// Holds the app behind a spinner while the stored session is verified.
export default function AuthBootstrap({ children }) {
  const { isLoading } = useBootstrapAuth()

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    )
  }

  return children
}
