import { useState } from 'react'
import { Card, Typography, Input, Row, Col } from 'antd'
import MyAppointmentsTab from './MyAppointmentsTab.jsx'

// The patient's appointments, with cancel and prescription/report viewing.
export default function MyAppointmentsPage() {
  const [search, setSearch] = useState('')
  return (
    <Card>
      <Row justify="space-between" align="middle" gutter={[8, 8]} wrap style={{ marginBottom: 12 }}>
        <Col><Typography.Title level={4} style={{ margin: 0 }}>My Appointments</Typography.Title></Col>
        <Col>
          <Input.Search placeholder="Search by Appointment ID or Doctor" allowClear value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ width: 280 }} />
        </Col>
      </Row>
      <MyAppointmentsTab search={search} />
    </Card>
  )
}
