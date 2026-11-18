import RowActions from '../../components/common/RowActions.jsx'

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
        <RowActions
          module="SPECIALTIES"
          record={record}
          onEdit={onEdit}
          onDelete={onDelete}
          deleteTitle="Delete this specialty?"
        />
      ),
    },
  ]
}
