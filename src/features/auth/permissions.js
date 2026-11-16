import { useSelector } from 'react-redux'
import { selectPermissions } from '../../store/authSlice.js'

// True when the permission list grants the given module/action authority.
export function hasPermission(permissions, module, action) {
  return Array.isArray(permissions) && permissions.includes(`${module}_${action}`)
}

// Reads permissions from redux and exposes convenience checks.
export function usePermission() {
  const permissions = useSelector(selectPermissions)
  return {
    can: (module, action) => hasPermission(permissions, module, action),
    canView: (module) => hasPermission(permissions, module, 'VIEW'),
  }
}
