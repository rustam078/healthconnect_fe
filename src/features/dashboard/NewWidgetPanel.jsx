import { useEffect, useState } from 'react'
import { Input, Select, Button, Space, Alert, Spin, Typography, Form, theme, App } from 'antd'
import { PlayCircleOutlined, SaveOutlined, ClearOutlined } from '@ant-design/icons'
import { useDryRunWidget, useCreateWidget } from './boardsHooks.js'
import WidgetBody from './WidgetBody.jsx'

const { Text } = Typography

const TYPES = ['COUNT', 'TABLE', 'BAR', 'LINE', 'PIE']

// "Active doctors (2026)" -> "active-doctors-2026"
// The backend needs a unique code and nobody enjoys inventing one, so it follows the
// name until the developer edits it by hand.
export function toCode(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150)
}

// The "New widget" tab of the Add-widget drawer - the developer's way in.
//
// Flow: write SQL -> "Run preview" runs it WITHOUT saving -> the rows are drawn with the
// same component the board uses -> save it once it looks right.
//
// Nothing is written to the database before Save. That is deliberate: a widget saved
// first and deleted after would be SOFT deleted, and its code would stay reserved in the
// unique index forever.
export default function NewWidgetPanel({ open, onAdd }) {
  const { token } = theme.useToken()
  const { message } = App.useApp()

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [codeEdited, setCodeEdited] = useState(false)
  const [type, setType] = useState('TABLE')
  const [description, setDescription] = useState('')
  const [sql, setSql] = useState('')
  const [rows, setRows] = useState(null) // null = nothing previewed yet
  const [codeError, setCodeError] = useState(null)

  const dryRun = useDryRunWidget()
  const create = useCreateWidget()

  const resetForm = () => {
    setName('')
    setCode('')
    setCodeEdited(false)
    setType('TABLE')
    setDescription('')
    setSql('')
    setRows(null)
    setCodeError(null)
    dryRun.reset()
  }

  // The drawer is never unmounted on close, so without this a developer who drafts a
  // query, closes the drawer and reopens it later finds last time's form and preview
  // still sitting there. Start clean each time the drawer opens, same as the gallery
  // does for its own selection.
  useEffect(() => {
    if (!open) return
    resetForm()
    // Deliberately keyed on `open` alone. resetForm closes over dryRun, whose identity
    // changes when the mutation settles - listing it here would re-run this effect the
    // moment a preview finished and wipe the very rows it had just produced.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleName = (value) => {
    setName(value)
    if (!codeEdited) setCode(toCode(value))
  }

  // Any edit to the query throws the preview away. Previewing query A and saving query B
  // is the one mistake this panel exists to prevent.
  const handleSql = (value) => {
    setSql(value)
    if (rows !== null) setRows(null)
    if (dryRun.isError) dryRun.reset()
  }

  const runPreview = () =>
    dryRun.mutate(
      { sqlTemplate: sql, pageSize: 20 },
      { onSuccess: (data) => setRows(data?.rows ?? []) },
    )

  // Save is only reachable once the query has actually run. A widget nobody has watched
  // render is exactly what this tab exists to keep out of the library.
  const canSave =
    name.trim() !== '' && code.trim() !== '' && sql.trim() !== '' && rows !== null

  const handleSave = () => {
    setCodeError(null)
    create.mutate(
      {
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        sqlTemplate: sql,
      },
      {
        onSuccess: (created) => {
          onAdd({
            id: created.id,
            code: created.code,
            name: created.name,
            type: created.type,
            module: created.module,
            status: created.status,
          })
          resetForm()
          message.success('Widget saved to the library')
        },
        onError: (e) => {
          // A taken code is the one failure with an obvious home on the form, so it is
          // shown against the field to fix rather than in a toast that covers it.
          const onCode = e.fieldErrors?.code || (/code/i.test(e.message) ? e.message : null)
          if (onCode) setCodeError(onCode)
          else message.error(e.message || 'Could not save the widget')
        },
      },
    )
  }

  const sqlBoxStyle = {
    fontFamily: 'Consolas, "Courier New", monospace',
    fontSize: 12,
    lineHeight: 1.5,
  }

  return (
    <Form layout="vertical">
      <Text type="secondary">
        Write the query yourself. It runs without being saved, so you can see exactly what
        the card will show before anything reaches the library.
      </Text>

      <Form.Item label="Name" required style={{ marginTop: 16 }}>
        <Input
          value={name}
          onChange={(e) => handleName(e.target.value)}
          placeholder="Doctors per specialty"
          maxLength={200}
        />
      </Form.Item>

      <Form.Item
        label="Code"
        required
        validateStatus={codeError ? 'error' : undefined}
        help={codeError || 'Unique. Used to look the widget up later.'}
      >
        <Input
          value={code}
          onChange={(e) => {
            setCodeEdited(true)
            setCodeError(null)
            setCode(e.target.value)
          }}
          placeholder="doctors-per-specialty"
          maxLength={150}
        />
      </Form.Item>

      <Form.Item label="Type">
        <Select
          value={type}
          onChange={setType}
          options={TYPES.map((t) => ({ label: t, value: t }))}
          style={{ maxWidth: 200 }}
        />
      </Form.Item>

      <Form.Item label="Description">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this widget answers (optional)"
          maxLength={1000}
        />
      </Form.Item>

      <Form.Item label="SQL" required>
        <Input.TextArea
          rows={6}
          value={sql}
          onChange={(e) => handleSql(e.target.value)}
          placeholder="SELECT label_column, numeric_column FROM ..."
          style={sqlBoxStyle}
          // A dry run in flight is keyed to the SQL that was submitted. Letting the
          // developer change the text mid-flight would let a response for an already-
          // abandoned query land on top of a preview for different SQL than what's shown.
          disabled={dryRun.isPending}
        />
      </Form.Item>

      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        <Space wrap>
          <Button
            icon={<PlayCircleOutlined />}
            loading={dryRun.isPending}
            disabled={!sql.trim()}
            onClick={runPreview}
          >
            Run preview
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={create.isPending}
            disabled={!canSave}
            onClick={handleSave}
          >
            Save widget
          </Button>
          <Button icon={<ClearOutlined />} onClick={resetForm}>
            Discard
          </Button>
        </Space>

        {dryRun.isError && (
          <Alert
            type="error"
            showIcon
            message="This query didn't run"
            description={dryRun.error?.message}
          />
        )}

        {rows !== null && rows.length === 0 && (
          <Alert
            type="warning"
            showIcon
            message="Ran fine, but returned no rows"
            description="You can still save it - the card will read 'No data' until there are rows."
          />
        )}

        {dryRun.isPending && <Spin />}

        {rows !== null && rows.length > 0 && (
          <div>
            <Text strong>Preview</Text>
            <div
              className="hide-scrollbar"
              style={{
                marginTop: 8,
                padding: 12,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadius,
                height: 260,
                overflow: 'auto',
              }}
            >
              <WidgetBody type={type} rows={rows} />
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Change the type above to see the same rows drawn a different way.
            </Text>
          </div>
        )}
      </Space>
    </Form>
  )
}
