import { usePermission } from './permissions.js'

// Renders children only when the user has the given module/action permission.
export default function Can({ module, action, children }) {
  const { can } = usePermission()
  return can(module, action) ? children : null
}
