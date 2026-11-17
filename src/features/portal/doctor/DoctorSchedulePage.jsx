import { Card, Typography } from 'antd'
import ScheduleTab from './ScheduleTab.jsx'

// The doctor's day: appointments with a per-row prescription editor.
export default function DoctorSchedulePage() {
  return (
    <Card>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        My Schedule
      </Typography.Title>
      <ScheduleTab />
    </Card>
  )
}
