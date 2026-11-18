import { useState } from 'react'
import { Card, Table, Button, Space, Tag, Typography, Switch, App } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useUsers, useDeleteUser, useUpdateUser } from './usersHooks.js'
import { getErrorMessage } from '../../utils/apiError.js'
import { usePermission } from '../auth/permissions.js'
import Can from '../auth/Can.jsx'
import RowActions from '../../components/common/RowActions.jsx'
import UserFormModal from './UserFormModal.jsx'

export default function UserListPage() {
  const { message } = App.useApp()
  const { can } = usePermission()
  const [modal, setModal] = useState({ open: false, mode: 'create', record: null })

  const { data, isFetching, isError, error } = useUsers()
  const deleteMutation = useDeleteUser()
  const updateMutation = useUpdateUser()
  const rows = data ?? []
  const canToggle = can('USERS', 'UPDATE')

  const handleDelete = (record) => {
    deleteMutation.mutate(record.id, {
      onSuccess: () => message.success('User deleted'),
      onError: (e) => message.error(getErrorMessage(e)),
    })
  }

  // Activate or deactivate a user in place, keeping its role and links unchanged.
  const toggleEnabled = (record) => {
    const payload = {
      roleId: record.roleId,
      enabled: !record.enabled,
      doctorId: record.doctorId ?? null,
      patientId: record.patientId ?? null,
    }
    updateMutation.mutate(
      { id: record.id, payload },
      {
        onSuccess: () => message.success(record.enabled ? 'User deactivated' : 'User activated'),
        onError: (e) => message.error(getErrorMessage(e)),
      },
    )
  }

  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 140,
      render: (v, record) =>
        canToggle ? (
          <Switch
            checked={v}
            checkedChildren="Active"
            unCheckedChildren="Inactive"
            loading={updateMutation.isPending && updateMutation.variables?.id === record.id}
            onChange={() => toggleEnabled(record)}
          />
        ) : v ? (
          <Tag color="green">Enabled</Tag>
        ) : (
          <Tag color="red">Disabled</Tag>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <RowActions
          module="USERS"
          record={record}
          onEdit={(r) => setModal({ open: true, mode: 'edit', record: r })}
          onDelete={handleDelete}
          deleteTitle="Delete this user?"
        />
      ),
    },
  ]

  return (
    <Card>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Users
        </Typography.Title>
        <Can module="USERS" action="CREATE">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModal({ open: true, mode: 'create', record: null })}
          >
            New user
          </Button>
        </Can>
      </Space>

      {isError && <Typography.Text type="danger">{getErrorMessage(error)}</Typography.Text>}

      <Table rowKey="id" loading={isFetching} columns={columns} dataSource={rows} />

      <UserFormModal
        open={modal.open}
        mode={modal.mode}
        initialValues={modal.record}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
      />
    </Card>
  )
}
