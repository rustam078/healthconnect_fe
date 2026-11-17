import { Card, Typography } from 'antd'
import MyAppointmentsTab from './MyAppointmentsTab.jsx'

// The patient's appointments, with cancel and prescription viewing.
export default function MyAppointmentsPage() {
  return (
    <Card>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        My Appointments
      </Typography.Title>
      <MyAppointmentsTab />
    </Card>
  )
}
