import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout.jsx'
import DashboardPage from '../features/dashboard/DashboardPage.jsx'
import PatientListPage from '../features/patients/PatientListPage.jsx'
import SpecialtyListPage from '../features/specialties/SpecialtyListPage.jsx'
import NotFoundPage from '../components/common/NotFoundPage.jsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'patients', element: <PatientListPage /> },
      { path: 'specialties', element: <SpecialtyListPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
