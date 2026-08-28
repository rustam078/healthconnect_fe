import { useEffect, useState } from 'react'
import { Drawer, Tabs, Row, Col, Spin, Alert, Empty, Button, Space, Typography, Input, App } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
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
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('library')

  // Start clean each time the gallery opens - a stale selection from last time would be
  // added silently, and a stale search would hide most of the library for no visible
  // reason on a box the reader has to scroll up to notice.
  useEffect(() => {
    if (!open) return
    setSelected([])
    setSearch('')
    setTab('library')
  }, [open])

  // Filtering happens here rather than on the server: the gallery already holds every
  // widget in memory (two fetches, cached), so a round trip per keystroke would buy
  // nothing but latency.
  const term = search.trim().toLowerCase()
  const shownWidgets = term
    ? widgets.filter((w) => w.name?.toLowerCase().includes(term))
    : widgets

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
  ) : shownWidgets.length === 0 ? (
    <Empty description={`No widget's title matches "${search.trim()}".`} />
  ) : (
    // Two per row, not three: a drawer is narrower than the modal this replaced, and
    // three cards across left the previews too small to tell apart.
    <Row gutter={[16, 16]}>
      {shownWidgets.map((widget) => (
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
        activeKey={tab}
        onChange={setTab}
        // The tab bar's empty right half is the natural home for this: it is beside the
        // Library tab it filters, and it costs the cards no vertical room. It appears only
        // on that tab, since a search box above a question box or a SQL form would look
        // like it searched those.
        tabBarExtraContent={
          tab === 'library' && widgets.length > 0
            ? {
                right: (
                  <Input
                    allowClear
                    size="small"
                    prefix={<SearchOutlined />}
                    placeholder="Search by title"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 220 }}
                  />
                ),
              }
            : undefined
        }
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
