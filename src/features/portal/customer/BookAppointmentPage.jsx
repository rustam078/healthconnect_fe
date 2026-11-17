import { Card, Typography } from 'antd'
import FindDoctorTab from './FindDoctorTab.jsx'

// Availability-first booking: pick a date + specialty, see only available doctors, book a slot.
export default function BookAppointmentPage() {
  return (
    <Card>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        Book Appointment
      </Typography.Title>
      <FindDoctorTab />
    </Card>
  )
}
