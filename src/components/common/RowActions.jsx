import { Button, Popconfirm, Space } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { usePermission } from '../../features/auth/permissions.js'

// Edit/Delete row buttons gated by the user's module permissions; shows a muted
// "View only" label when the user may look but not change the row.
export default function RowActions({
  module,
  record,
  onEdit,
  onDelete,
  deleteTitle = 'Delete this item?',
  deleteDescription,
  allowDelete = true,
}) {
  const { can } = usePermission()
  const showEdit = can(module, 'UPDATE')
  const showDelete = can(module, 'DELETE') && allowDelete

  if (!showEdit && !showDelete) {
    return <span style={{ color: '#9AA7A3' }}>View only</span>
  }

  return (
    <Space>
      {showEdit && (
        <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)}>
          Edit
        </Button>
      )}
      {showDelete && (
        <Popconfirm
          title={deleteTitle}
          description={deleteDescription}
          okText="Delete"
          okButtonProps={{ danger: true }}
          onConfirm={() => onDelete(record)}
        >
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )}
    </Space>
  )
}
