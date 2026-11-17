import { Card, Descriptions, Typography } from 'antd'
import { useSelector } from 'react-redux'
import { selectUser } from '../../../store/authSlice.js'

// The signed-in account's details (role name may be a string or an object).
function roleName(role) {
  if (!role) return '—'
  return typeof role === 'string' ? role : role.name ?? '—'
}

export default function MyProfilePage() {
  const user = useSelector(selectUser)

  return (
    <Card>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        My Profile
      </Typography.Title>
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Username">{user?.username ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Role">{roleName(user?.role)}</Descriptions.Item>
      </Descriptions>
    </Card>
  )
}
