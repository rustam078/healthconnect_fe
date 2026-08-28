import { useEffect, useState } from 'react'
import { Drawer, Tabs, Row, Col, Spin, Alert, Empty, Button, Space, Typography, App } from 'antd'
import { useGalleryWidgets, useDeleteWidget } from './boardsHooks.js'
import WidgetPreviewCard from './WidgetPreviewCard.jsx'
import AskAiPanel from './AskAiPanel.jsx'
import NewWidgetPanel from './NewWidgetPanel.jsx'

const { Text } = Typography

// Writing raw SQL is a developer's job, and the tab shows raw database errors to match.
// There is no auth yet, so it is on for everyone; when Spring Security lands this single
// line becomes the role check.
const canCreateWidgets = true

// The widget picker, as a side drawer. Tick as many as you like, then "Add selected".
//
// Widgets already on the board come through in existingWidgetIds: they show as ticked and
// disabled, so the same widget can never be added twice.
export default function WidgetGallery({ open, onClose, onConfirm, existingWidgetIds = [] }) {
  const { message } = App.useApp()
  const { data: widgets, isLoading, error } = useGalleryWidgets()
  const deleteWidget = useDeleteWidget()

  const [selected, setSelected] = useState([]) // gallery widget objects, not ids

  // Start clean each time the gallery opens - a stale selection from last time would be
  // added silently.
  useEffect(() => {
    if (open) setSelected([])
  }, [open])

  const toggle = (widget) =>
    setSelected((current) =>
      current.some((w) => w.id === widget.id)
        ? current.filter((w) => w.id !== widget.id)
        : [...current, widget],
    )

  const addToSelection = (widget) => setSelected((current) => [...current, widget])

  const handleDelete = (widget) =>
    deleteWidget.mutate(widget.id, {
      onSuccess: () => {
        setSelected((current) => current.filter((w) => w.id !== widget.id))
        message.success(`Deleted "${widget.name}"`)
      },
      onError: (e) => message.error(e.message || 'Could not delete the widget'),
    })

  const handleConfirm = () => {
    onConfirm(selected)
    onClose()
  }

  const library = isLoading ? (
    <Spin />
  ) : error ? (
    <Alert type="error" message={error.message || 'Failed to load widgets'} />
  ) : widgets.length === 0 ? (
    <Empty description="No widgets yet. Try the Ask AI tab." />
  ) : (
    // Two per row, not three: a drawer is narrower than the modal this replaced, and
    // three cards across left the previews too small to tell apart.
    <Row gutter={[16, 16]}>
      {widgets.map((widget) => (
        <Col key={widget.id} xs={24} sm={12}>
          <WidgetPreviewCard
            widget={widget}
            selected={selected.some((w) => w.id === widget.id)}
            disabled={existingWidgetIds.includes(widget.id)}
            onToggle={toggle}
            onDelete={handleDelete}
          />
        </Col>
      ))}
    </Row>
  )

  return (
    <Drawer
      title="Select widgets"
      placement="right"
      // antd v6 deprecated `width` on Drawer in favour of `size`, which takes a number.
      size={760}
      open={open}
      onClose={onClose}
      footer={
        <Space>
          <Text type="secondary">
            {selected.length === 0 ? 'Nothing selected' : `${selected.length} selected`}
          </Text>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" disabled={selected.length === 0} onClick={handleConfirm}>
            Add selected
          </Button>
        </Space>
      }
    >
      <Tabs
        defaultActiveKey="library"
        items={[
          { key: 'library', label: 'Library', children: library },
          {
            key: 'ai',
            label: 'Ask AI',
            children: <AskAiPanel onAdd={addToSelection} />,
          },
          ...(canCreateWidgets
            ? [
                {
                  key: 'new',
                  label: 'New widget',
                  children: <NewWidgetPanel open={open} onAdd={addToSelection} />,
                },
              ]
            : []),
        ]}
      />
    </Drawer>
  )
}
