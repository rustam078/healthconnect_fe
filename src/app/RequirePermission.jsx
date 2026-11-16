import { Result } from 'antd'
import { usePermission } from '../features/auth/permissions.js'

// Gates a route behind VIEW permission for the given module.
export default function RequirePermission({ module, children }) {
  const { canView } = usePermission()
  if (!canView(module)) return <Result status="403" title="Not authorized" />
  return children
}
