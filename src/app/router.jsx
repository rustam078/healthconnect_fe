import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout.jsx'
import DashboardPage from '../features/dashboard/DashboardPage.jsx'
import PatientListPage from '../features/patients/PatientListPage.jsx'
import PatientDetailPage from '../features/patients/PatientDetailPage.jsx'
import DoctorListPage from '../features/doctors/DoctorListPage.jsx'
import DoctorDetailPage from '../features/doctors/DoctorDetailPage.jsx'
import SpecialtyListPage from '../features/specialties/SpecialtyListPage.jsx'
import AppointmentsPage from '../features/appointments/AppointmentsPage.jsx'
import SettingListPage from '../features/settings/SettingListPage.jsx'
import NotFoundPage from '../components/common/NotFoundPage.jsx'
import LoginPage from '../features/auth/LoginPage.jsx'
import RequireAuth from './RequireAuth.jsx'
import RequirePermission from './RequirePermission.jsx'

// Wraps a route element with its module VIEW gate.
const gated = (module, element) => (
  <RequirePermission module={module}>{element}</RequirePermission>
)

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: gated('DASHBOARD', <DashboardPage />) },
      { path: 'patients', element: gated('PATIENTS', <PatientListPage />) },
      { path: 'patients/:patientId', element: gated('PATIENTS', <PatientDetailPage />) },
      { path: 'doctors', element: gated('DOCTORS', <DoctorListPage />) },
      { path: 'doctors/:doctorId', element: gated('DOCTORS', <DoctorDetailPage />) },
      { path: 'specialties', element: gated('SPECIALTIES', <SpecialtyListPage />) },
      { path: 'appointments', element: gated('APPOINTMENTS', <AppointmentsPage />) },
      { path: 'settings', element: gated('SETTINGS', <SettingListPage />) },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
