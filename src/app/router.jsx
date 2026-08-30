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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'patients', element: <PatientListPage /> },
      { path: 'patients/:patientId', element: <PatientDetailPage /> },
      { path: 'doctors', element: <DoctorListPage /> },
      { path: 'doctors/:doctorId', element: <DoctorDetailPage /> },
      { path: 'specialties', element: <SpecialtyListPage /> },
      { path: 'appointments', element: <AppointmentsPage /> },
      { path: 'settings', element: <SettingListPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
