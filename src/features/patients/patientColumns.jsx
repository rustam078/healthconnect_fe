import { Button, Popconfirm, Space, Tag } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { GENDER_OPTIONS, BLOOD_GROUP_OPTIONS } from '../../constants/enums.js'

const GENDER_LABEL = Object.fromEntries(GENDER_OPTIONS.map((o) => [o.value, o.label]))
const BLOOD_LABEL = Object.fromEntries(BLOOD_GROUP_OPTIONS.map((o) => [o.value, o.label]))
const GENDER_COLOR = { MALE: 'blue', FEMALE: 'magenta', OTHER: 'default' }

const dash = <span style={{ color: '#9AA7A3' }}>—</span>

export function getPatientColumns({ onEdit, onDelete }) {
  return [
    { title: 'Code', dataIndex: 'patientCode', key: 'patientCode', width: 130 },
    {
      title: 'Name',
      key: 'name',
      render: (_, r) => [r.firstName, r.lastName].filter(Boolean).join(' ') || dash,
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      width: 110,
      render: (v) =>
        v ? <Tag color={GENDER_COLOR[v] || 'default'}>{GENDER_LABEL[v] || v}</Tag> : dash,
    },
    { title: 'Age', dataIndex: 'age', key: 'age', width: 80 },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', width: 140 },
    { title: 'Email', dataIndex: 'email', key: 'email', ellipsis: true },
    {
      title: 'Blood',
      dataIndex: 'bloodGroup',
      key: 'bloodGroup',
      width: 95,
      render: (v) => (v ? <Tag color="cyan">{BLOOD_LABEL[v] || v}</Tag> : dash),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this patient?"
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
