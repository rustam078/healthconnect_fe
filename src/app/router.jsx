import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout.jsx'
import Home from './Home.jsx'
import PatientListPage from '../features/patients/PatientListPage.jsx'
import PatientDetailPage from '../features/patients/PatientDetailPage.jsx'
import DoctorListPage from '../features/doctors/DoctorListPage.jsx'
import DoctorDetailPage from '../features/doctors/DoctorDetailPage.jsx'
import SpecialtyListPage from '../features/specialties/SpecialtyListPage.jsx'
import AppointmentsPage from '../features/appointments/AppointmentsPage.jsx'
import SettingListPage from '../features/settings/SettingListPage.jsx'
import RoleListPage from '../features/roles/RoleListPage.jsx'
import UserListPage from '../features/users/UserListPage.jsx'
import DoctorSchedulePage from '../features/portal/doctor/DoctorSchedulePage.jsx'
import DoctorAppointmentPage from '../features/portal/doctor/DoctorAppointmentPage.jsx'
import DoctorPatientsPage from '../features/portal/doctor/DoctorPatientsPage.jsx'
import DoctorPatientDetailPage from '../features/portal/doctor/DoctorPatientDetailPage.jsx'
import BookAppointmentPage from '../features/portal/customer/BookAppointmentPage.jsx'
import MyAppointmentsPage from '../features/portal/customer/MyAppointmentsPage.jsx'
import MyPrescriptionsPage from '../features/portal/customer/MyPrescriptionsPage.jsx'
import MyReportsPage from '../features/portal/customer/MyReportsPage.jsx'
import MyProfilePage from '../features/portal/customer/MyProfilePage.jsx'
import ReportsPage from '../features/reports/ReportsPage.jsx'
import CommunityPage from '../features/community/CommunityPage.jsx'
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
      { index: true, element: <Home /> },
      { path: 'patients', element: gated('PATIENTS', <PatientListPage />) },
      { path: 'patients/:patientId', element: gated('PATIENTS', <PatientDetailPage />) },
      { path: 'doctors', element: gated('DOCTORS', <DoctorListPage />) },
      { path: 'doctors/:doctorId', element: gated('DOCTORS', <DoctorDetailPage />) },
      { path: 'specialties', element: gated('SPECIALTIES', <SpecialtyListPage />) },
      { path: 'appointments', element: gated('APPOINTMENTS', <AppointmentsPage />) },
      { path: 'settings', element: gated('SETTINGS', <SettingListPage />) },
      { path: 'roles', element: gated('ROLES', <RoleListPage />) },
      { path: 'users', element: gated('USERS', <UserListPage />) },
      { path: 'reports', element: gated('REPORTS', <ReportsPage />) },
      { path: 'community', element: gated('COMMUNITIES', <CommunityPage />) },
      { path: 'doctor/schedule', element: gated('DOCTOR_PORTAL', <DoctorSchedulePage />) },
      { path: 'doctor/appointments/:appointmentId', element: gated('DOCTOR_PORTAL', <DoctorAppointmentPage />) },
      { path: 'doctor/patients', element: gated('DOCTOR_PORTAL', <DoctorPatientsPage />) },
      { path: 'doctor/patients/:patientId', element: gated('DOCTOR_PORTAL', <DoctorPatientDetailPage />) },
      { path: 'me/book', element: gated('CUSTOMER_PORTAL', <BookAppointmentPage />) },
      { path: 'me/appointments', element: gated('CUSTOMER_PORTAL', <MyAppointmentsPage />) },
      { path: 'me/prescriptions', element: gated('CUSTOMER_PORTAL', <MyPrescriptionsPage />) },
      { path: 'me/reports', element: gated('CUSTOMER_PORTAL', <MyReportsPage />) },
      { path: 'me/profile', element: gated('CUSTOMER_PORTAL', <MyProfilePage />) },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
