import { useState } from 'react'
import { Card, Table, Input, Button, Space, Select, Typography, App } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { usePatients, useDeletePatient } from './patientsHooks.js'
import { getPatientColumns } from './patientColumns.jsx'
import PatientFormModal from './PatientFormModal.jsx'
import { GENDER_OPTIONS, BLOOD_GROUP_OPTIONS } from '../../constants/enums.js'
import { getErrorMessage } from '../../utils/apiError.js'

export default function PatientListPage() {
  const { message } = App.useApp()
  const [search, setSearch] = useState('')
  const [gender, setGender] = useState()
  const [bloodGroup, setBloodGroup] = useState()
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)
  const [modal, setModal] = useState({ open: false, mode: 'create', record: null })

  const { data, isFetching, isError, error } = usePatients({
    search,
    gender,
    bloodGroup,
    page,
    size,
  })
  const deleteMutation = useDeletePatient()

  const rows = data?.content ?? []
  const total = data?.totalElements ?? 0

  const handleDelete = (record) => {
    deleteMutation.mutate(record.id, {
      onSuccess: () => message.success('Patient deleted'),
      onError: (e) => message.error(getErrorMessage(e)),
    })
  }

  const columns = getPatientColumns({
    onEdit: (record) => setModal({ open: true, mode: 'edit', record }),
    onDelete: handleDelete,
  })

  return (
    <Card>
      <Space
        style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}
        align="start"
        wrap
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          Patients
        </Typography.Title>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Search name, phone, email, code"
            style={{ width: 260 }}
            onSearch={(v) => {
              setSearch(v)
              setPage(1)
            }}
          />
          <Select
            allowClear
            placeholder="Gender"
            style={{ width: 130 }}
            options={GENDER_OPTIONS}
            value={gender}
            onChange={(v) => {
              setGender(v)
              setPage(1)
            }}
          />
          <Select
            allowClear
            placeholder="Blood group"
            style={{ width: 140 }}
            options={BLOOD_GROUP_OPTIONS}
            value={bloodGroup}
            onChange={(v) => {
              setBloodGroup(v)
              setPage(1)
            }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModal({ open: true, mode: 'create', record: null })}
          >
            Add Patient
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
        scroll={{ x: 900 }}
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

      <PatientFormModal
        open={modal.open}
        mode={modal.mode}
        initialValues={modal.record}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
      />
    </Card>
  )
}
