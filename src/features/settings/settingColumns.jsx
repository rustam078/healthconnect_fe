import { Button, Popconfirm, Space, Switch, Tag, Tooltip, Typography } from 'antd'
import { EditOutlined, DeleteOutlined, LockOutlined } from '@ant-design/icons'

// Long values (a base-url, a prompt) would push the actions column off the screen, so the
// cell shows the start of one and the whole thing sits in a tooltip.
const VALUE_CHARS = 48

// Values that read as a yes or a no. Shown as a tag rather than as the word, because a
// plain "false" sitting beside a green Enabled switch looks like a contradiction - and
// both of them really do turn the setting off (see useSetting).
const YES_WORDS = new Set(['true', '1', 'yes', 'on'])
const NO_WORDS = new Set(['false', '0', 'no', 'off'])

export function getSettingColumns({ onEdit, onDelete, onToggle, togglingId }) {
  return [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      // Monospace on purpose: these are lookup keys used verbatim in code, not prose, and
      // a dotted key is easier to read apart when the characters line up.
      render: (v, record) => (
        <Space size={6}>
          <Typography.Text code>{v}</Typography.Text>
          {record.secret && (
            <Tooltip title="The value is hidden. Editing shows a blank box - fill it only to replace the value.">
              <LockOutlined style={{ color: '#faad14' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (v) => {
        if (v === null || v === undefined || v === '') return <Typography.Text type="secondary">—</Typography.Text>
        const text = String(v)

        const word = text.trim().toLowerCase()
        if (YES_WORDS.has(word)) return <Tag color="success">{text}</Tag>
        if (NO_WORDS.has(word)) return <Tag color="default">{text}</Tag>

        const short = text.length > VALUE_CHARS ? `${text.slice(0, VALUE_CHARS)}…` : text
        return (
          <Tooltip title={text.length > VALUE_CHARS ? text : null}>
            <Typography.Text style={{ fontSize: 13 }}>{short}</Typography.Text>
          </Tooltip>
        )
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (v) => v || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Enabled',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 110,
      // A switch in the row, not buried in the form: turning a setting off is the thing
      // people come to this screen to do, and a disabled setting reads as absent to the
      // code using it. The value is left out of the request, so flipping a secret cannot
      // overwrite the key it is hiding.
      render: (v, record) => (
        <Space size={6}>
          <Switch
            size="small"
            checked={!!v}
            loading={togglingId === record.id}
            onChange={(checked) => onToggle(record, checked)}
          />
          {!v && <Tag>Off</Tag>}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this setting?"
            description="Whatever reads it falls back to its default."
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
