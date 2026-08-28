import { useEffect, useState } from 'react'
import { Card, Select, Button, Space, Modal, Input, Empty, Spin, Popconfirm, Tag, App } from 'antd'
import {
  PlusOutlined,
  AppstoreAddOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
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
          <Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            New board
          </Button>
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
            <Button type="primary" icon={<EditOutlined />} onClick={startEditing}>
              Edit
            </Button>
            <Popconfirm title="Delete this board?" onConfirm={handleDeleteBoard}>
              <Button danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
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
