import { useMemo, useState } from 'react'
import { Card, Table, Input, Button, Space, Typography, Alert, App } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useSettings, useDeleteSetting, useUpdateSetting } from './settingsHooks.js'
import { getSettingColumns } from './settingColumns.jsx'
import { getErrorMessage } from '../../utils/apiError.js'
import SettingFormModal from './SettingFormModal.jsx'

export default function SettingListPage() {
  const { message } = App.useApp()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)
  const [modal, setModal] = useState({ open: false, mode: 'create', record: null })
  // Which row's switch is mid-flight, so only that one shows a spinner.
  const [togglingId, setTogglingId] = useState(null)

  const { data, isFetching, isError, error } = useSettings()
  const deleteMutation = useDeleteSetting()
  const updateMutation = useUpdateSetting()

  // Filtered here rather than on the server: the endpoint returns every setting in one
  // response because there are only ever a handful, so a round trip per keystroke would
  // buy nothing.
  const rows = useMemo(() => {
    const all = data ?? []
    const term = search.trim().toLowerCase()
    if (!term) return all
    return all.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.description ?? '').toLowerCase().includes(term),
    )
  }, [data, search])

  const handleDelete = (record) => {
    deleteMutation.mutate(record.id, {
      onSuccess: () => message.success('Setting deleted'),
      onError: (e) => message.error(getErrorMessage(e)),
    })
  }

  // The switch in the row. No `value` in the payload, so the server keeps the stored one -
  // which is the only way to turn a secret off without knowing the key it hides.
  const handleToggle = (record, checked) => {
    setTogglingId(record.id)
    updateMutation.mutate(
      {
        id: record.id,
        payload: {
          name: record.name,
          description: record.description ?? null,
          secret: record.secret,
          enabled: checked,
          ...(record.secret ? {} : { value: record.value }),
        },
      },
      {
        onSuccess: () => message.success(checked ? 'Setting enabled' : 'Setting disabled'),
        onError: (e) => message.error(getErrorMessage(e)),
        onSettled: () => setTogglingId(null),
      },
    )
  }

  const columns = getSettingColumns({
    onEdit: (record) => setModal({ open: true, mode: 'edit', record }),
    onDelete: handleDelete,
    onToggle: handleToggle,
    togglingId,
  })

  return (
    <Card>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Settings
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
            onChange={(e) => {
              if (!e.target.value) setSearch('')
            }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModal({ open: true, mode: 'create', record: null })}
          >
            Add Setting
          </Button>
        </Space>
      </Space>

      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Values the app reads at runtime, so they can be changed without a redeploy. A
        disabled setting reads as absent and the feature behind it falls back to its
        default.
      </Typography.Paragraph>

      {isError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Could not load settings"
          description={getErrorMessage(error)}
        />
      )}

      <Table
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={rows}
        pagination={{
          current: page,
          pageSize: size,
          total: rows.length,
          showSizeChanger: true,
          showTotal: (t, range) => `${range[0]}-${range[1]} of ${t}`,
          onChange: (p, s) => {
            setPage(p)
            setSize(s)
          },
        }}
      />

      <SettingFormModal
        open={modal.open}
        mode={modal.mode}
        initialValues={modal.record}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
      />
    </Card>
  )
}
