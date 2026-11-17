import { useState } from 'react'
import { Card, Table, Button, Space, Tag, Typography, Popconfirm, App } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useUsers, useDeleteUser } from './usersHooks.js'
import { getErrorMessage } from '../../utils/apiError.js'
import Can from '../auth/Can.jsx'
import UserFormModal from './UserFormModal.jsx'

export default function UserListPage() {
  const { message } = App.useApp()
  const [modal, setModal] = useState({ open: false, mode: 'create', record: null })

  const { data, isFetching, isError, error } = useUsers()
  const deleteMutation = useDeleteUser()
  const rows = data ?? []

  const handleDelete = (record) => {
    deleteMutation.mutate(record.id, {
      onSuccess: () => message.success('User deleted'),
      onError: (e) => message.error(getErrorMessage(e)),
    })
  }

  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 120,
      render: (v) => (v ? <Tag color="green">Enabled</Tag> : <Tag color="red">Disabled</Tag>),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Can module="USERS" action="UPDATE">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => setModal({ open: true, mode: 'edit', record })}
            >
              Edit
            </Button>
          </Can>
          <Can module="USERS" action="DELETE">
            <Popconfirm
              title="Delete this user?"
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Can>
        </Space>
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
