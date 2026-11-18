import { Tag, Tooltip } from 'antd'
import { Link } from 'react-router-dom'
import { enumLabel } from '../../constants/enums.js'
import { formatCurrency } from '../../utils/format.js'
import RowActions from '../../components/common/RowActions.jsx'

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
        v ? <Tag color={GENDER_COLOR[v] || 'default'}>{enumLabel(v)}</Tag> : dash,
    },
    { title: 'Qualification', dataIndex: 'qualification', key: 'qualification', ellipsis: true },
    {
      title: 'Specialties',
      key: 'specialties',
      width: 180,
      render: (_, r) => {
        const [first, ...rest] = r.specialties ?? []
        if (!first) return dash
        return (
          <Tooltip title={(r.specialties ?? []).join(', ')}>
            <span>
              <Tag color="cyan">{first}</Tag>
              {rest.length > 0 && <Tag>+{rest.length}</Tag>}
            </span>
          </Tooltip>
        )
      },
    },
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
        <RowActions
          module="DOCTORS"
          record={record}
          onEdit={onEdit}
          onDelete={onDelete}
          deleteTitle="Delete this doctor?"
        />
      ),
    },
  ]
}
