import { Card, Typography } from 'antd'
import MyReportsTab from './MyReportsTab.jsx'

// The patient's own uploaded reports, previewable inline.
export default function MyReportsPage() {
  return (
    <Card>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        My Reports
      </Typography.Title>
      <MyReportsTab />
    </Card>
  )
}
