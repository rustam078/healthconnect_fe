import { useState } from 'react'
import { Input, Button, Space, Alert, Spin, Table, Empty, Typography, theme, App } from 'antd'
import { ThunderboltOutlined, PlusOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons'
import { useGenerateQuery, useApproveWidget } from './aiHooks.js'
import { useWidgetData, useDeleteWidget } from './boardsHooks.js'

const { Text } = Typography

// The "Ask AI" tab of the Add-widget drawer.
//
// Flow: type a question -> the backend asks the AI, checks the answer is a safe SELECT,
// and saves it as a DRAFT widget -> we show the generated SQL and the first few rows ->
// "Add to board" approves it and puts it on the board.
//
// Why the preview matters: the AI can write SQL that passes the safety check but still
// refers to a column that isn't there. Running it here means a query that CANNOT RUN can
// never become a card - "Add to board" stays disabled. Drafts we reject are deleted, so
// they don't pile up in the widget table.
// onAdd receives a GALLERY WIDGET ({ id, code, name, type, module }) so the gallery can
// treat an AI result exactly like any other selected card.
export default function AskAiPanel({ onAdd }) {
  const { message } = App.useApp()
  const { token } = theme.useToken()

  const [question, setQuestion] = useState('')
  const [title, setTitle] = useState('')
  const [draft, setDraft] = useState(null)

  const generate = useGenerateQuery()
  const approve = useApproveWidget()
  const discard = useDeleteWidget()

  // Run the draft for a handful of rows. DRAFT widgets are runnable - the backend checks
  // "enabled", not "status".
  const { data: preview, isLoading: previewLoading, error: previewError } = useWidgetData(draft?.code, 5)
  const rows = preview?.rows ?? []

  const handleGenerate = () => {
    const asked = question.trim()
    if (!asked) return
    generate.mutate({ question: asked, title: title.trim() }, {
      onSuccess: (generated) => setDraft(generated),
    })
  }

  // "Try again" and "Discard" both delete the draft so unwanted rows don't accumulate.
  // They differ only in whether the question stays behind for editing.
  const dropDraft = (keepQuestion) => {
    const id = draft.widgetId
    setDraft(null) // clear straight away so the panel feels responsive
    if (!keepQuestion) {
      setQuestion('')
      setTitle('')
    }
    discard.mutate(id, {
      onError: (e) => message.error(e.message || 'Could not discard the draft'),
    })
  }

  const handleAdd = () => {
    approve.mutate(draft.widgetId, {
      onSuccess: () => {
        // Shape it like a gallery widget. AI drafts are always TABLE (SqlDraftService
        // hardcodes it), and always PROMPT.
        onAdd({
          id: draft.widgetId,
          code: draft.code,
          name: draft.name,
          type: 'TABLE',
          module: 'PROMPT',
          status: 'APPROVED',
        })
        setDraft(null)
        setQuestion('')
        setTitle('')
        message.success('Added to your selection')
      },
      onError: (e) => message.error(e.message || 'Could not add the widget'),
    })
  }

  const sqlBoxStyle = {
    margin: '8px 0 0',
    padding: 12,
    background: token.colorFillTertiary,
    color: token.colorText,
    borderRadius: token.borderRadius,
    fontSize: 12,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: 220,
    overflow: 'auto',
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">
        Describe what you want to see. The AI writes the query — you check it before it goes
        on the board. The title is what appears as the card's heading; leave it blank and
        the question is used.
      </Text>


      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title shown on the widget (optional)"
        disabled={generate.isPending || !!draft}
        maxLength={200}
      />
      <Input.TextArea
        rows={3}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onPressEnter={(e) => {
          if (!e.shiftKey && !draft) {
            e.preventDefault()
            handleGenerate()
          }
        }}
        placeholder="e.g. how many appointments were booked today"
        disabled={generate.isPending || !!draft}
        maxLength={500}
        showCount
      />

      {!draft && (
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          loading={generate.isPending}
          disabled={!question.trim()}
          onClick={handleGenerate}
          block
        >
          Generate
        </Button>
      )}

      {generate.isError && (
        <Alert
          type="error"
          showIcon
          message="Could not generate a query"
          description={generate.error?.message}
        />
      )}

      {draft && (
        <>
          <div>
            <Text strong>Generated SQL</Text>
            <pre style={sqlBoxStyle}>{draft.sql}</pre>
          </div>

          <div>
            <Text strong>Preview</Text>
            <div style={{ marginTop: 8 }}>
              {previewLoading ? (
                <Spin />
              ) : previewError ? (
                <Alert
                  type="error"
                  showIcon
                  message="This query didn't run"
                  description={previewError.message}
                />
              ) : rows.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Ran fine, but returned no rows" />
              ) : (
                <Table
                  size="small"
                  pagination={false}
                  scroll={{ x: true }}
                  columns={Object.keys(rows[0]).map((c) => ({ title: c, dataIndex: c, key: c }))}
                  dataSource={rows.map((r, i) => ({ key: i, ...r }))}
                />
              )}
            </div>
          </div>

          <Space wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              loading={approve.isPending}
              disabled={previewLoading || !!previewError}
              onClick={handleAdd}
            >
              Add to selection
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => dropDraft(true)}>
              Try again
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={() => dropDraft(false)}>
              Discard
            </Button>
          </Space>

          {previewError && (
            <Text type="secondary">
              A query that can’t run won’t be added. Reword the question and try again.
            </Text>
          )}
        </>
      )}
    </Space>
  )
}
