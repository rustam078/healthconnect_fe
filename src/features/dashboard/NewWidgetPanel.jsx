import { useEffect, useState } from 'react'
import { Input, Select, Button, Space, Alert, Spin, Typography, Form, Row, Col, theme, App } from 'antd'
import { PlayCircleOutlined, SaveOutlined, ClearOutlined } from '@ant-design/icons'
import { useDryRunWidget, useCreateWidget, useUpdateWidget, useWidget } from './boardsHooks.js'
import WidgetBody from './WidgetBody.jsx'
import WidgetFilterEditor, { toFilterConfig, fromFilterConfig } from './WidgetFilterEditor.jsx'
import SqlEditor from './SqlEditor.jsx'

const { Text } = Typography

const TYPES = ['COUNT', 'TABLE', 'BAR', 'LINE', 'PIE']

// Gap between the two fields in a row. Only horizontal: the Form.Item below each field
// already provides the vertical rhythm, and a row gutter here would double it.
const FIELD_GUTTER = 16

// The card's heading has one line to work with before it wraps and steals height from the
// chart under it. The longest widget in the library is 25 characters.
const TITLE_MAX = 30

// WIDGET = a card for a board. INTEGRATION = a saved query used as an API, and the way a
// dropdown gets its options (see optionsFrom). PROMPT is the AI tab's own module, not
// something to pick by hand here.
const MODULES = ['WIDGET', 'INTEGRATION']

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
export default function NewWidgetPanel({ open, onAdd, editingId, onDoneEditing }) {
  const { token } = theme.useToken()
  const { message } = App.useApp()

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [codeEdited, setCodeEdited] = useState(false)
  const [type, setType] = useState('TABLE')
  const [module, setModule] = useState('WIDGET')
  const [filterRules, setFilterRules] = useState([])
  const [description, setDescription] = useState('')
  const [sql, setSql] = useState('')
  const [rows, setRows] = useState(null) // null = nothing previewed yet
  const [codeError, setCodeError] = useState(null)

  const dryRun = useDryRunWidget()
  const create = useCreateWidget()
  const updateW = useUpdateWidget()
  const { data: existing } = useWidget(editingId ? String(editingId) : null)
  const isEditing = !!editingId

  const resetForm = () => {
    setName('')
    setCode('')
    setCodeEdited(false)
    setType('TABLE')
    setModule('WIDGET')
    setFilterRules([])
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
  // Editing pours the saved widget into the same form. Keyed on the fetched widget rather
  // than on editingId, so the fill happens when the data actually arrives, not when the
  // request is sent.
  useEffect(() => {
    if (!existing) return
    setName(existing.name ?? '')
    setCode(existing.code ?? '')
    setCodeEdited(true) // an existing code must never be re-slugged from the name
    setType(existing.type ?? 'TABLE')
    setModule(existing.module ?? 'WIDGET')
    setDescription(existing.description ?? '')
    setSql(existing.sqlTemplate ?? '')
    setFilterRules(fromFilterConfig(existing.filters))
    setRows(null)
    setCodeError(null)
  }, [existing])

  useEffect(() => {
    if (!open || editingId) return
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
    const payload = {
      code: code.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      module,
      filters: toFilterConfig(filterRules),
      sqlTemplate: sql,
    }

    if (isEditing) {
      updateW.mutate(
        { id: editingId, ...payload },
        {
          onSuccess: () => {
            message.success('Widget updated')
            onDoneEditing?.()
            resetForm()
          },
          onError: (e) => message.error(e.message || 'Could not update the widget'),
        },
      )
      return
    }

    create.mutate(
      payload,
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

  return (
    <Form layout="vertical">
      {/* The short fields pair up two to a row. The drawer is wide enough for it, and
          stacking six full-width boxes pushed the SQL box - the one field anyone actually
          works in - below the fold. */}
      <Row gutter={FIELD_GUTTER}>
        <Col xs={24} sm={12}>
          <Form.Item label="Title" required>
            <Input
              value={name}
              onChange={(e) => handleName(e.target.value)}
              placeholder="Doctors per specialty"
              // Short on purpose: this is the card's heading, and a longer one wraps to a
              // second line and eats the height the chart was given.
              maxLength={TITLE_MAX}
              showCount
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Code"
            required
            validateStatus={codeError ? 'error' : undefined}
            // Only the error. A code that is already taken is worth saying; that a code is
            // unique is not something anyone needed telling.
            help={codeError}
          >
            <Input
              value={code}
              // Fixed once saved: boards and option lookups refer to a widget by its code,
              // so renaming it would quietly orphan them. The backend leaves it out of the
              // update request for the same reason.
              disabled={isEditing}
              onChange={(e) => {
                setCodeEdited(true)
                setCodeError(null)
                setCode(e.target.value)
              }}
              placeholder="doctors-per-specialty"
              maxLength={150}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={FIELD_GUTTER}>
        <Col xs={24} sm={12}>
          <Form.Item label="Type">
            <Select
              value={type}
              onChange={setType}
              options={TYPES.map((t) => ({ label: t, value: t }))}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Module">
            <Select
              value={module}
              onChange={setModule}
              // Fixed once saved, like the code. Moving a widget between modules changes
              // who can see it - a WIDGET turned INTEGRATION vanishes from the gallery and
              // off the boards using it, and a lookup turned WIDGET appears in the picker
              // as a card nobody wants. Decided when it is created, not by accident after.
              disabled={isEditing}
              options={MODULES.map((m) => ({ label: m, value: m }))}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Description, filters and SQL stay full width - they hold long text, and half a
          drawer is not enough to read a query in. */}
      <Form.Item label="Description">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this widget answers (optional)"
          maxLength={1000}
        />
      </Form.Item>

      <Form.Item label="Filters">
        <WidgetFilterEditor rules={filterRules} onChange={setFilterRules} />
      </Form.Item>

      <Form.Item label="SQL" required>
        <SqlEditor
          value={sql}
          onChange={handleSql}
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
            loading={create.isPending || updateW.isPending}
            disabled={!canSave}
            onClick={handleSave}
          >
            {isEditing ? 'Update widget' : 'Save widget'}
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={() => {
              resetForm()
              onDoneEditing?.()
            }}
          >
            {isEditing ? 'Cancel edit' : 'Discard'}
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
