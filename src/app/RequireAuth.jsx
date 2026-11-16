import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from '../store/authSlice.js'

// Blocks the app shell for unauthenticated users.
export default function RequireAuth({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}
