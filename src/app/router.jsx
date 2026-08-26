import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout.jsx'
import DashboardPage from '../features/dashboard/DashboardPage.jsx'
import NotFoundPage from '../components/common/NotFoundPage.jsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      // Specialties route added in Task 6
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
