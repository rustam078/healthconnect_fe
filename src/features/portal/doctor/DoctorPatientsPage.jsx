import { Card, Table, Typography, Alert, Space } from 'antd'
import { Link } from 'react-router-dom'
import { useDepartmentPatients } from './doctorPortalHooks.js'
import InitialAvatar from '../../../components/common/InitialAvatar.jsx'
import { getErrorMessage } from '../../../utils/apiError.js'

// Every patient in the doctor's department; click one to open their full record.
export default function DoctorPatientsPage() {
  const { data, isFetching, isError, error } = useDepartmentPatients()
  const rows = data ?? []

  const columns = [
    { title: 'Code', dataIndex: 'patientCode', key: 'patientCode' },
    {
      title: 'Name',
      key: 'name',
      render: (_, r) => {
        const fullName = `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim()
        return (
          <Space>
            <InitialAvatar size={30} name={fullName} avatarFileId={r.avatarFileId} />
            <Link to={`/doctor/patients/${r.id}`}>{fullName}</Link>
          </Space>
        )
      },
    },
    { title: 'Age', dataIndex: 'age', key: 'age' },
    { title: 'Gender', dataIndex: 'gender', key: 'gender' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
  ]

  return (
    <Card>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        My Patients
      </Typography.Title>
      {isError && <Alert type="error" message={getErrorMessage(error)} style={{ marginBottom: 12 }} />}
      <Table
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={rows}
        scroll={{ x: 640 }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />
    </Card>
  )
}
