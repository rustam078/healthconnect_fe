import { useState } from 'react'
import { Card, Table, Input, Button, Space, Typography, App } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useSpecialties, useDeleteSpecialty } from './specialtiesHooks.js'
import { getSpecialtyColumns } from './specialtyColumns.jsx'
import { getErrorMessage } from '../../utils/apiError.js'

export default function SpecialtyListPage() {
  const { message } = App.useApp()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)

  const { data, isFetching, isError, error } = useSpecialties({ search, page, size })
  const deleteMutation = useDeleteSpecialty()

  const rows = data?.content ?? []
  const total = data?.totalElements ?? 0

  const handleDelete = (record) => {
    deleteMutation.mutate(record.id, {
      onSuccess: () => message.success('Specialty deleted'),
      onError: (e) => message.error(getErrorMessage(e)),
    })
  }

  const columns = getSpecialtyColumns({
    onEdit: () => message.info('Edit form arrives in the next task'),
    onDelete: handleDelete,
  })

  return (
    <Card>
      <Space
        style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          Specialties
        </Typography.Title>
        <Space>
          <Input.Search
            allowClear
            placeholder="Search name or description"
            style={{ width: 280 }}
            onSearch={(v) => {
              setSearch(v)
              setPage(1)
            }}
          />
          <Button type="primary" icon={<PlusOutlined />} disabled>
            Add Specialty
          </Button>
        </Space>
      </Space>

      {isError && (
        <Typography.Text type="danger">{getErrorMessage(error)}</Typography.Text>
      )}

      <Table
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={rows}
        pagination={{
          current: page,
          pageSize: size,
          total,
          showSizeChanger: true,
          onChange: (p, s) => {
            setPage(p)
            setSize(s)
          },
        }}
      />
    </Card>
  )
}
