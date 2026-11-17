import { Card } from 'antd'
import ScheduleTab from './ScheduleTab.jsx'

// The doctor's day: title, search + date on one row, then the schedule/completed tabs.
export default function DoctorSchedulePage() {
  return (
    <Card>
      <ScheduleTab />
    </Card>
  )
}
