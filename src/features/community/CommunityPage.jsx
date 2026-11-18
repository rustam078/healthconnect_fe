import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useQueryClient } from '@tanstack/react-query'
import { Empty } from 'antd'
import { MessageOutlined } from '@ant-design/icons'
import { selectUser } from '../../store/authSlice.js'
import { usePermission } from '../auth/permissions.js'
import { useMyCommunities } from './communityHooks.js'
import { useChatStream } from './useChatStream.js'
import CommunityList from './CommunityList.jsx'
import ChatPane from './ChatPane.jsx'
import CreateGroupDrawer from './CreateGroupDrawer.jsx'
import ManageMembersDrawer from './ManageMembersDrawer.jsx'
import { BRAND } from '../../app/theme.js'

export default function CommunityPage() {
  const user = useSelector(selectUser)
  const currentUserId = user?.id
  const { can } = usePermission()
  const qc = useQueryClient()
  const { data: communities } = useMyCommunities()

  const [selectedId, setSelectedId] = useState(null)
  const [online, setOnline] = useState(() => new Set())
  const [createOpen, setCreateOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const liveRef = useRef(null)

  const selected = useMemo(
    () => (communities ?? []).find((c) => c.id === selectedId) || null,
    [communities, selectedId],
  )

  // Auto-select the first group once the list loads.
  useEffect(() => {
    if (!selectedId && communities?.length) setSelectedId(communities[0].id)
  }, [communities, selectedId])

  useChatStream({
    message: (m) => { qc.invalidateQueries({ queryKey: ['communities'] }); liveRef.current?.onMessage?.(m) },
    message_deleted: (p) => liveRef.current?.onDeleted?.(p),
    communities_changed: () => qc.invalidateQueries({ queryKey: ['communities'] }),
    presence: (p) => setOnline((prev) => {
      const next = new Set(prev)
      if (p.online) next.add(p.userId)
      else next.delete(p.userId)
      return next
    }),
    presence_snapshot: (p) => setOnline(new Set(p.online ?? [])),
  })

  return (
    <div style={{
      display: 'flex', height: 'calc(100vh / var(--ui-scale) - 120px)', background: '#fff',
      border: `1px solid ${BRAND.border}`, borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(16,40,36,0.06)',
    }}>
      <CommunityList
        communities={communities}
        selectedId={selectedId}
        onSelect={setSelectedId}
        canCreate={can('COMMUNITIES', 'CREATE')}
        onNewGroup={() => setCreateOpen(true)}
      />

      {selected ? (
        <ChatPane
          key={selected.id}
          community={selected}
          currentUserId={currentUserId}
          liveRef={liveRef}
          onManage={() => setManageOpen(true)}
          onLeft={() => setSelectedId(null)}
        />
      ) : (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', background: BRAND.pageBg }}>
          <Empty image={<MessageOutlined style={{ fontSize: 56, color: '#C2CBC8' }} />}
            description="Select a group to start chatting" />
        </div>
      )}

      <CreateGroupDrawer open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(c) => setSelectedId(c.id)} />
      <ManageMembersDrawer open={manageOpen} onClose={() => setManageOpen(false)} community={selected} onlineSet={online} />
    </div>
  )
}
