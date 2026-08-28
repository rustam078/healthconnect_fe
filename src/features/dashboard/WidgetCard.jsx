import { Card, Spin, Alert, Popconfirm, Button } from 'antd'
import { DeleteOutlined, HolderOutlined } from '@ant-design/icons'
import { useWidgetData } from './boardsHooks.js'
import WidgetBody from './WidgetBody.jsx'

// Renders ONE widget on a board. It fetches its own data and hands the rows to WidgetBody.
//
// In edit mode it also shows a drag handle and a remove button. Width and height come from
// dragging the card's edges now, so there is no width control here any more.
export default function WidgetCard({ item, editable = false, onRemove }) {
  const { data, isLoading, error } = useWidgetData(item.code)
  const rows = data?.rows ?? []

  return (
    <Card
      title={item.name}
      size="small"
      // Fill the grid cell: the cell has a fixed pixel height, and the body scrolls
      // rather than the card overflowing it.
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, overflow: 'auto' } }}
      classNames={{ body: 'hide-scrollbar' }}
      extra={
        editable && (
          <Popconfirm title="Remove from board?" onConfirm={() => onRemove(item.widgetId)}>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        )
      }
    >
      {editable && (
        // The whole card is draggable; this just tells the user so.
        <div style={{ textAlign: 'center', color: '#bbb', lineHeight: 1, marginBottom: 4 }}>
          <HolderOutlined />
        </div>
      )}
      {isLoading ? (
        <Spin />
      ) : error ? (
        <Alert type="error" message={error.message || 'Failed to load'} />
      ) : (
        <WidgetBody type={item.type} rows={rows} />
      )}
    </Card>
  )
}
