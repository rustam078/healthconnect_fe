import { Card, Tag, Spin, Checkbox, Popconfirm, Button, Space, Typography, theme } from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useWidgetData } from './boardsHooks.js'
import WidgetBody from './WidgetBody.jsx'

const { Text } = Typography

// One card in the widget gallery: the widget's name, a LIVE mini preview of what it
// actually renders, and a tick to select it.
//
// The preview is the point - a name and a type tag tell you almost nothing, whereas
// seeing the real number or chart tells you whether you want it.
//
// A preview whose query fails degrades to a muted line and the card STAYS SELECTABLE:
// a broken preview should not stop you adding a widget you already know you want, nor
// make the whole gallery look broken.
export default function WidgetPreviewCard({ widget, selected, disabled, onToggle, onDelete, onEdit }) {
  const { token } = theme.useToken()
  const { data, isLoading, error } = useWidgetData(widget.code, 5)
  const rows = data?.rows ?? []

  const isAi = widget.module === 'PROMPT'

  return (
    <Card
      size="small"
      hoverable={!disabled}
      onClick={() => !disabled && onToggle(widget)}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        borderColor: selected ? token.colorPrimary : undefined,
        borderWidth: selected ? 2 : 1,
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Checkbox checked={selected || disabled} disabled={disabled} />
          <span style={{ fontWeight: 500, whiteSpace: 'normal' }}>{widget.name}</span>
        </div>
      }
      extra={
        <Space size={0}>
          {/* Every widget can be edited - a wrong operator or a typo in the SQL should not
              mean recreating it under a new code. */}
          <Button
            size="small"
            type="text"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              onEdit(widget)
            }}
          />
          {isAi && (
          // Deleting is restricted to AI widgets on purpose: those accumulate one per
          // question asked, whereas hand-built widgets are shared and other boards use them.
          <Popconfirm
            title={`Delete "${widget.name}" from the library?`}
            description="It disappears from every board."
            onConfirm={(e) => {
              e?.stopPropagation?.()
              onDelete(widget)
            }}
            onCancel={(e) => e?.stopPropagation?.()}
          >
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
          )}
        </Space>
      }
    >
      <div style={{ height: 130, overflow: 'hidden' }}>
        {isLoading ? (
          <Spin size="small" />
        ) : error ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Preview unavailable
          </Text>
        ) : (
          <WidgetBody type={widget.type} rows={rows} compact />
        )}
      </div>
      <div style={{ marginTop: 8 }}>
        <Tag>{widget.type}</Tag>
        {isAi && <Tag color="purple">AI</Tag>}
      </div>
    </Card>
  )
}
