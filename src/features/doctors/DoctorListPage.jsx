import { useState } from 'react'
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Select,
  InputNumber,
  Popover,
  Badge,
  Typography,
  App,
} from 'antd'
import { PlusOutlined, FilterOutlined } from '@ant-design/icons'
import { useDoctors, useDeleteDoctor } from './doctorsHooks.js'
import { getDoctorColumns } from './doctorColumns.jsx'
import DoctorFormModal from './DoctorFormModal.jsx'
import { GENDER_OPTIONS } from '../../constants/enums.js'
import { getErrorMessage } from '../../utils/apiError.js'

const EMPTY_FILTERS = {
  gender: undefined,
  qualification: '',
  minExperience: null,
  maxExperience: null,
  minConsultationFee: null,
  maxConsultationFee: null,
}

function countActive(f) {
  return Object.values(f).filter((v) => v !== undefined && v !== null && v !== '').length
}

export default function DoctorListPage() {
  const { message } = App.useApp()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [draft, setDraft] = useState(EMPTY_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)
  const [modal, setModal] = useState({ open: false, mode: 'create', record: null })

  const { data, isFetching, isError, error } = useDoctors({ search, filter: filters, page, size })
  const deleteMutation = useDeleteDoctor()

  const rows = data?.content ?? []
  const total = data?.totalElements ?? 0
  const activeCount = countActive(filters)

  const handleDelete = (record) => {
    deleteMutation.mutate(record.id, {
      onSuccess: () => message.success('Doctor deleted'),
      onError: (e) => message.error(getErrorMessage(e)),
    })
  }

  const columns = getDoctorColumns({
    onEdit: (record) => setModal({ open: true, mode: 'edit', record }),
    onDelete: handleDelete,
  })

  const openFilters = (open) => {
    if (open) setDraft(filters)
    setFilterOpen(open)
  }
  const applyFilters = () => {
    setFilters(draft)
    setPage(1)
    setFilterOpen(false)
  }
  const resetFilters = () => {
    setDraft(EMPTY_FILTERS)
    setFilters(EMPTY_FILTERS)
    setPage(1)
    setFilterOpen(false)
  }
  const setDraftField = (key, value) => setDraft((d) => ({ ...d, [key]: value }))

  const filterPanel = (
    <div style={{ width: 300 }}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>Gender</Typography.Text>
          <Select
            allowClear
            placeholder="Any"
            style={{ width: '100%' }}
            options={GENDER_OPTIONS}
            value={draft.gender}
            onChange={(v) => setDraftField('gender', v)}
          />
        </div>
        <div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>Qualification</Typography.Text>
          <Input
            placeholder="e.g. MD"
            value={draft.qualification}
            onChange={(e) => setDraftField('qualification', e.target.value)}
          />
        </div>
        <div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>Experience (years)</Typography.Text>
          <Space>
            <InputNumber
              min={0}
              placeholder="Min"
              value={draft.minExperience}
              onChange={(v) => setDraftField('minExperience', v)}
            />
            <InputNumber
              min={0}
              placeholder="Max"
              value={draft.maxExperience}
              onChange={(v) => setDraftField('maxExperience', v)}
            />
          </Space>
        </div>
        <div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>Consultation fee (₹)</Typography.Text>
          <Space>
            <InputNumber
              min={0}
              placeholder="Min"
              value={draft.minConsultationFee}
              onChange={(v) => setDraftField('minConsultationFee', v)}
            />
            <InputNumber
              min={0}
              placeholder="Max"
              value={draft.maxConsultationFee}
              onChange={(v) => setDraftField('maxConsultationFee', v)}
            />
          </Space>
        </div>
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button size="small" onClick={resetFilters}>Reset</Button>
          <Button size="small" type="primary" onClick={applyFilters}>Apply</Button>
        </Space>
      </Space>
    </div>
  )

  return (
    <Card>
      <Space
        style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}
        align="start"
        wrap
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          Doctors
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
          <Popover
            trigger="click"
            placement="bottomRight"
            open={filterOpen}
            onOpenChange={openFilters}
            content={filterPanel}
          >
            <Badge count={activeCount} size="small">
              <Button icon={<FilterOutlined />}>Filters</Button>
            </Badge>
          </Popover>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModal({ open: true, mode: 'create', record: null })}
          >
            Add Doctor
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
        scroll={{ x: 960 }}
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

      <DoctorFormModal
        open={modal.open}
        mode={modal.mode}
        initialValues={modal.record}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
      />
    </Card>
  )
}
