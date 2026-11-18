import { useState } from 'react'
import { Card, Table, Button, Space, Tag, Typography, App } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useRoles, useDeleteRole } from './rolesHooks.js'
import { getErrorMessage } from '../../utils/apiError.js'
import Can from '../auth/Can.jsx'
import RowActions from '../../components/common/RowActions.jsx'
import RoleFormModal from './RoleFormModal.jsx'

export default function RoleListPage() {
  const { message } = App.useApp()
  const [modal, setModal] = useState({ open: false, mode: 'create', record: null })

  const { data, isFetching, isError, error } = useRoles()
  const deleteMutation = useDeleteRole()
  const rows = data ?? []

  const handleDelete = (record) => {
    deleteMutation.mutate(record.id, {
      onSuccess: () => message.success('Role deleted'),
      onError: (e) => message.error(getErrorMessage(e)),
    })
  }

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Type',
      key: 'system',
      width: 120,
      render: (_, r) =>
        r.system ? <Tag color="blue">System</Tag> : <Tag>Custom</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <RowActions
          module="ROLES"
          record={record}
          onEdit={(r) => setModal({ open: true, mode: 'edit', record: r })}
          onDelete={handleDelete}
          deleteTitle="Delete this role?"
          allowDelete={!record.system}
        />
      ),
    },
  ]

  return (
    <Card>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Roles
        </Typography.Title>
        <Can module="ROLES" action="CREATE">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModal({ open: true, mode: 'create', record: null })}
          >
            New role
          </Button>
        </Can>
      </Space>

      {isError && <Typography.Text type="danger">{getErrorMessage(error)}</Typography.Text>}

      <Table rowKey="id" loading={isFetching} columns={columns} dataSource={rows} />

      <RoleFormModal
        open={modal.open}
        mode={modal.mode}
        initialValues={modal.record}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
      />
    </Card>
  )
}
