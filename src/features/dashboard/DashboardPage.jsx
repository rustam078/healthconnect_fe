import { Typography, Card } from 'antd'

export default function DashboardPage() {
  return (
    <Card>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Welcome to HealthConnect
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Use the navigation on the left to manage specialties, patients, doctors, and appointments.
      </Typography.Paragraph>
    </Card>
  )
}
