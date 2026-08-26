import { Button, Popconfirm, Space } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'

export function getSpecialtyColumns({ onEdit, onDelete }) {
  return [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (v) => v || <span style={{ color: '#999' }}>—</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this specialty?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(record)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]
}
