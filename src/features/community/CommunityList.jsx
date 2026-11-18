import { useState } from 'react'
import { Input, Button, Badge, Empty, Divider, Typography, App } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import InitialAvatar from '../../components/common/InitialAvatar.jsx'
import { visibilityMeta } from './communityMeta.jsx'
import { useDiscover, useJoin } from './communityHooks.js'
import { getErrorMessage } from '../../utils/apiError.js'
import { BRAND } from '../../app/theme.js'

function Row({ c, active, onClick }) {
  const meta = visibilityMeta(c.visibility)
  return (
    <div onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer',
        background: active ? '#E7F0EE' : 'transparent', borderLeft: `3px solid ${active ? BRAND.primary : 'transparent'}`,
      }}>
      <InitialAvatar name={c.name} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: c.unreadCount ? 700 : 600, color: BRAND.heading, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {c.name}
        </div>
        <div style={{ fontSize: 12, color: '#6B7A76' }}>{meta.icon} {meta.label} · {c.memberCount} members</div>
      </div>
      {c.unreadCount > 0 && <Badge count={c.unreadCount} style={{ backgroundColor: BRAND.primary }} />}
    </div>
  )
}

export default function CommunityList({ communities, selectedId, onSelect, canCreate, onNewGroup }) {
  const { message } = App.useApp()
  const [search, setSearch] = useState('')
  const discover = useDiscover()
  const join = useJoin()

  const q = search.trim().toLowerCase()
  const rows = (communities ?? []).filter((c) => !q || c.name.toLowerCase().includes(q))
  const discoverable = discover.data ?? []

  const handleJoin = (id) => join.mutate(id, {
    onSuccess: (c) => { message.success('Joined'); onSelect(c.id) },
    onError: (e) => message.error(getErrorMessage(e)),
  })

  return (
    <div style={{ width: 330, borderRight: `1px solid ${BRAND.border}`, display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ padding: 14, borderBottom: `1px solid ${BRAND.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Typography.Title level={4} style={{ margin: 0, color: BRAND.heading }}>Community</Typography.Title>
          {canCreate && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onNewGroup}>New</Button>}
        </div>
        <Input.Search allowClear placeholder="Search groups" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {rows.length === 0 && <Empty description="No groups yet" style={{ marginTop: 40 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        {rows.map((c) => <Row key={c.id} c={c} active={c.id === selectedId} onClick={() => onSelect(c.id)} />)}

        {discoverable.length > 0 && (
          <>
            <Divider plain style={{ margin: '8px 0', fontSize: 12, color: '#9AA7A3' }}>Discover</Divider>
            {discoverable.map((c) => {
              const meta = visibilityMeta(c.visibility)
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
                  <InitialAvatar name={c.name} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: BRAND.heading }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: '#6B7A76' }}>{meta.icon} {meta.label} · {c.memberCount}</div>
                  </div>
                  <Button size="small" loading={join.isPending} onClick={() => handleJoin(c.id)}>Join</Button>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
