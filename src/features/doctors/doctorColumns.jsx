import { Button, Popconfirm, Space, Tag } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { GENDER_OPTIONS } from '../../constants/enums.js'
import { formatCurrency } from '../../utils/format.js'

const GENDER_LABEL = Object.fromEntries(GENDER_OPTIONS.map((o) => [o.value, o.label]))
const GENDER_COLOR = { MALE: 'blue', FEMALE: 'magenta', OTHER: 'default' }
const dash = <span style={{ color: '#9AA7A3' }}>—</span>

export function getDoctorColumns({ onEdit, onDelete }) {
  return [
    { title: 'Code', dataIndex: 'doctorCode', key: 'doctorCode', width: 130 },
    {
      title: 'Name',
      key: 'name',
      render: (_, r) => {
        const name = [r.firstName, r.lastName].filter(Boolean).join(' ')
        return name ? (
          <Link to={`/doctors/${r.id}`} style={{ fontWeight: 500 }}>
            {name}
          </Link>
        ) : (
          dash
        )
      },
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      width: 100,
      render: (v) =>
        v ? <Tag color={GENDER_COLOR[v] || 'default'}>{GENDER_LABEL[v] || v}</Tag> : dash,
    },
    { title: 'Qualification', dataIndex: 'qualification', key: 'qualification', ellipsis: true },
    {
      title: 'Experience',
      dataIndex: 'experienceYears',
      key: 'experienceYears',
      width: 120,
      render: (v) => (v || v === 0 ? `${v} yr${v === 1 ? '' : 's'}` : dash),
    },
    {
      title: 'Fee',
      dataIndex: 'consultationFee',
      key: 'consultationFee',
      width: 120,
      render: (v) => formatCurrency(v) || dash,
    },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', width: 140 },
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
            title="Delete this doctor?"
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
