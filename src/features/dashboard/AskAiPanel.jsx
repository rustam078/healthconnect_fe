import { useState } from 'react'
import { Input, Button, Space, Alert, Spin, Table, Empty, Typography, Modal, theme, App } from 'antd'
import { ThunderboltOutlined, PlusOutlined, ReloadOutlined, DeleteOutlined, BulbOutlined } from '@ant-design/icons'
import { useGenerateQuery, useApproveWidget, usePromptExamples } from './aiHooks.js'
import { enumLabel } from '../../constants/enums.js'
import { useWidgetData, useDeleteWidget } from './boardsHooks.js'
import { useSetting } from '../settings/settingsHooks.js'

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
  const [showExamples, setShowExamples] = useState(false)

  const { data: examples = [] } = usePromptExamples()

  // Whether the query itself is shown, or only what it returned.
  //
  // A developer wants to read the SQL before trusting a card; someone asking "how many
  // appointments today" wants the number. The setting decides which of the two this is,
  // without a rebuild - flip ai.show-sql in the settings table.
  const showSql = useSetting('ai.show-sql')

  const generate = useGenerateQuery()
  const approve = useApproveWidget()
  const discard = useDeleteWidget()

  // Run the draft for a handful of rows. DRAFT widgets are runnable - the backend checks
  // "enabled", not "status".
  const { data: preview, isLoading: previewLoading, error: previewError } = useWidgetData(draft?.code, 5)
  const rows = preview?.rows ?? []

  // `asked` is passed in when a sample prompt is clicked, because setQuestion has not
  // taken effect yet at that point and reading the state here would send the old text.
  const handleGenerate = (asked = question) => {
    const text = String(asked).trim()
    if (!text) return
    generate.mutate({ question: text, title: title.trim() }, {
      onSuccess: (generated) => setDraft(generated),
    })
  }

  // Ask one of the curated questions.
  //
  // Nothing special happens on this side - it fills the box and generates, exactly as if
  // it had been typed. The SERVER is what recognises the question and reuses the stored
  // SQL instead of calling the model, so a sample prompt is free, instant and always
  // correct, while an edited one still goes to the AI.
  const askExample = (example) => {
    setShowExamples(false)
    setQuestion(example.question)
    handleGenerate(example.question)
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

      {/* Knowing WHAT to ask is the hard part of a blank box, so the questions that are
          known to work are one click away rather than something to guess at. */}
      {!draft && examples.length > 0 && (
        <Button
          type="link"
          size="small"
          style={{ padding: 0, height: 'auto', alignSelf: 'flex-start' }}
          icon={<BulbOutlined />}
          onClick={() => setShowExamples(true)}
        >
          Click here for a few sample prompts
        </Button>
      )}

      {/* A dialog rather than an inline list: these questions are whole sentences, and
          twenty of them unfolding inside the panel pushed the box you type in off the
          screen. The dialog is also wider than the drawer, so nothing wraps mid-question. */}
      <Modal
        open={showExamples}
        title="Sample prompts"
        width={720}
        footer={null}
        onCancel={() => setShowExamples(false)}
        styles={{ body: { maxHeight: '60vh', overflow: 'auto' } }}
      >
        <Text type="secondary">
          Pick one to run it as it is, or close this and edit it into your own question.
        </Text>

        {examples.map(({ category, examples: rows }) => (
          <div key={category} style={{ marginTop: 20 }}>
            <Text strong>
              {category} <Text type="secondary">({rows.length})</Text>
            </Text>
            <Space orientation="vertical" size={0} style={{ width: '100%', marginTop: 4 }}>
              {rows.map((row) => (
                <Button
                  key={row.id}
                  type="link"
                  // Left-aligned and full width: these are sentences, and centred links of
                  // different lengths are hard to scan down a list.
                  style={{
                    padding: '3px 0',
                    height: 'auto',
                    textAlign: 'left',
                    whiteSpace: 'normal',
                  }}
                  onClick={() => askExample(row)}
                >
                  {row.question}
                </Button>
              ))}
            </Space>
          </div>
        ))}
      </Modal>

      {!draft && (
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          loading={generate.isPending}
          disabled={!question.trim()}
          onClick={() => handleGenerate()}
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
          {showSql && (
            <div>
              <Text strong>Generated SQL</Text>
              <pre style={sqlBoxStyle}>{draft.sql}</pre>
            </div>
          )}

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
                  columns={Object.keys(rows[0]).map((c) => ({
                    title: c,
                    dataIndex: c,
                    key: c,
                    // Same labelling as every other table: a stored A_POSITIVE reads as A+.
                    render: (value) => enumLabel(value),
                  }))}
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
