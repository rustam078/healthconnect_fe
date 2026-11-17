import { Navigate } from 'react-router-dom'
import DashboardPage from '../features/dashboard/DashboardPage.jsx'
import { usePermission } from '../features/auth/permissions.js'

// Send each role to its own landing page; the dashboard is admin-only.
export default function Home() {
  const { canView } = usePermission()
  if (canView('DASHBOARD')) return <DashboardPage />
  if (canView('DOCTOR_PORTAL')) return <Navigate to="/doctor/schedule" replace />
  if (canView('CUSTOMER_PORTAL')) return <Navigate to="/me/appointments" replace />
  return <Navigate to="/login" replace />
}
