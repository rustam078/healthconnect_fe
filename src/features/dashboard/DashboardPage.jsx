import { useEffect, useMemo, useState } from 'react'
import { Card, Select, Button, Space, Modal, Input, Empty, Spin, Tag, Popover, Badge, Dropdown, App } from 'antd'
import {
  PlusOutlined,
  AppstoreAddOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  FilterOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import {
  useBoards,
  useBoard,
  useCreateBoard,
  useSaveBoard,
  useDeleteBoard,
} from './boardsHooks.js'
import BoardGrid from './BoardGrid.jsx'
import WidgetGallery from './WidgetGallery.jsx'
import WidgetFilters, { parseFilterConfig } from './WidgetFilters.jsx'
import { useBoardDraft } from './useBoardDraft.js'
import { toSavePayload } from './boardLayout.js'

export default function DashboardPage() {
  const { message, modal } = App.useApp()
  const { data: boards = [], isLoading: boardsLoading } = useBoards()

  const [boardId, setBoardId] = useState(null)
  const [mode, setMode] = useState('view') // 'view' | 'edit'
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [boardFilters, setBoardFilters] = useState({})
  const [boardFilterLabels, setBoardFilterLabels] = useState({})

  // pick the first board once boards load (if none selected)
  useEffect(() => {
    if (!boardId && boards.length > 0) setBoardId(boards[0].id)
  }, [boards, boardId])

  const { data: board, isLoading: boardLoading } = useBoard(boardId)
  const createBoard = useCreateBoard()
  const saveBoard = useSaveBoard()
  const deleteBoard = useDeleteBoard()
  const draft = useBoardDraft(board)

  const editing = mode === 'edit'
  const savedItems = board?.items ?? []
  const shownItems = editing ? draft.items : savedItems

  // In view mode any layout change should remount the grid (there is no drag to protect).
  // In edit mode the draft's revision decides, and it deliberately ignores drags.
  const layoutKey = editing
    ? `edit-${boardId}-${draft.revision}`
    : `view-${boardId}-${savedItems.map((i) => [i.widgetId, i.x, i.y, i.w, i.h].join(',')).join('|')}`

  const startEditing = () => {
    draft.reset()
    setMode('edit')
  }

  const leaveEditing = () => {
    draft.reset()
    setMode('view')
  }

  const confirmDiscard = (onOk) => {
    if (!draft.isDirty) {
      onOk()
      return
    }
    modal.confirm({
      title: 'Discard your changes?',
      content: 'The layout you have arranged has not been saved.',
      okText: 'Discard',
      okButtonProps: { danger: true },
      onOk,
    })
  }

  const handleSave = () =>
    saveBoard.mutate(
      { id: boardId, payload: { items: toSavePayload(draft.items) } },
      {
        onSuccess: () => {
          setMode('view')
          message.success('Board saved')
        },
        onError: (e) => message.error(e.message || 'Save failed'),
      },
    )

  const handleSelectBoard = (nextId) =>
    editing
      ? confirmDiscard(() => {
          leaveEditing()
          setBoardId(nextId)
        })
      : setBoardId(nextId)

  const handleCreate = () => {
    if (!newName.trim()) return
    createBoard.mutate(
      { name: newName.trim() },
      {
        onSuccess: (created) => {
          setBoardId(created.id)
          setCreateOpen(false)
          setNewName('')
          // A brand-new board has nothing to arrange, so go straight to picking widgets.
          setMode('edit')
          setGalleryOpen(true)
          message.success('Board created')
        },
        onError: (e) => message.error(e.message || 'Create failed'),
      },
    )
  }

  const handleDeleteBoard = () => {
    deleteBoard.mutate(boardId, {
      onSuccess: () => {
        setBoardId(null)
        setMode('view')
        message.success('Board deleted')
      },
    })
  }

  // Every distinct filter the widgets on this board declare, so one control drives all of
  // them. Two reports that both take :fromDate share a single date picker.
  const boardRules = useMemo(() => {
    const byId = new Map()
    for (const item of shownItems) {
      // Dates only for now. A date means the same thing on every card, so sharing one is
      // safe; a "search" or a "status" often does not, and a board-wide box that silently
      // means something different per widget is worse than no board-wide box.
      for (const rule of parseFilterConfig(item.filters).filter((r) => r.type === 'date')) {
        if (!byId.has(rule.id)) byId.set(rule.id, rule)
      }
    }
    return [...byId.values()]
  }, [shownItems])

  if (boardsLoading) return <Spin />

  return (
    <Card
      title={
        <Space wrap>
          <Select
            style={{ minWidth: 220 }}
            placeholder="Select a board"
            value={boardId ?? undefined}
            onChange={handleSelectBoard}
            options={boards.map((b) => ({ label: b.name, value: b.id }))}
            notFoundContent="No boards yet"
          />
          {editing && <Tag color="processing">Editing</Tag>}
        </Space>
      }
      extra={
        boardId &&
        (editing ? (
          <Space>
            <Button icon={<AppstoreAddOutlined />} onClick={() => setGalleryOpen(true)}>
              Add widgets
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saveBoard.isPending}
              onClick={handleSave}
            >
              Save
            </Button>
            <Button icon={<CloseOutlined />} onClick={() => confirmDiscard(leaveEditing)}>
              Cancel
            </Button>
          </Space>
        ) : (
          <Space>
            {/* One filter for the whole board. Each card takes only the keys it declares,
                so a date range narrows every report that has dates and leaves the rest
                alone. */}
            {boardRules.length > 0 && (
              <Popover
                trigger="click"
                placement="bottomRight"
                title="Filter this board"
                content={
                  <div style={{ width: 260 }}>
                    <WidgetFilters
                      rules={boardRules}
                      immediate={false}
                      appliedValues={boardFilters}
                      appliedLabels={boardFilterLabels}
                      onApply={(filters, display) => {
                        setBoardFilters(filters)
                        setBoardFilterLabels(display)
                      }}
                    />
                  </div>
                }
              >
                <Badge dot={Object.keys(boardFilters).length > 0} offset={[-2, 2]}>
                  <Button icon={<FilterOutlined />} />
                </Badge>
              </Popover>
            )}
            <Dropdown
              // Click, not antd's default hover: a menu holding "Delete board" should not
              // open because the pointer crossed it on the way somewhere else.
              trigger={['click']}
              menu={{
                items: [
                  { key: 'edit', icon: <EditOutlined />, label: 'Edit board' },
                  { key: 'delete', icon: <DeleteOutlined />, label: 'Delete board', danger: true },
                  { key: 'create', icon: <PlusOutlined />, label: 'Create new board' },
                ],
                onClick: ({ key }) => {
                  if (key === 'edit') startEditing()
                  if (key === 'create') setCreateOpen(true)
                  // Deleting a board cannot be undone, so it asks first - the one item
                  // here that does not act immediately.
                  if (key === 'delete') {
                    modal.confirm({
                      title: 'Delete this board?',
                      content: 'The widgets stay in the library; only the board goes.',
                      okText: 'Delete',
                      okButtonProps: { danger: true },
                      onOk: handleDeleteBoard,
                    })
                  }
                },
              }}
            >
              <Button icon={<MoreOutlined />}>More</Button>
            </Dropdown>
          </Space>
        ))
      }
    >
      {!boardId ? (
        <Empty description="No board selected. Create one to get started.">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            New board
          </Button>
        </Empty>
      ) : boardLoading ? (
        <Spin />
      ) : (
        <BoardGrid
          items={shownItems}
          layoutKey={layoutKey}
          editable={editing}
          onLayoutChange={draft.applyLayout}
          onRemove={draft.removeWidget}
          boardFilters={boardFilters}
          boardFilterLabels={boardFilterLabels}
        />
      )}

      <WidgetGallery
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onConfirm={draft.addWidgets}
        existingWidgetIds={draft.items.map((i) => i.widgetId)}
      />

      <Modal
        title="Create a new board"
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => setCreateOpen(false)}
        confirmLoading={createBoard.isPending}
        okText="Create"
      >
        <Input
          placeholder="Board name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onPressEnter={handleCreate}
          autoFocus
        />
      </Modal>
    </Card>
  )
}
