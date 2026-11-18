import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Tag, Space, Popconfirm, Spin, App } from 'antd'
import { TeamOutlined, LogoutOutlined, DeleteOutlined } from '@ant-design/icons'
import InitialAvatar from '../../components/common/InitialAvatar.jsx'
import MessageList from './MessageList.jsx'
import MessageComposer from './MessageComposer.jsx'
import { visibilityMeta } from './communityMeta.jsx'
import * as api from './communityApi.js'
import { useDeleteCommunity, useRemoveMember } from './communityHooks.js'
import { getErrorMessage } from '../../utils/apiError.js'
import { BRAND } from '../../app/theme.js'

export default function ChatPane({ community, currentUserId, liveRef, onManage, onLeft }) {
  const { message } = App.useApp()
  const qc = useQueryClient()
  const [messages, setMessages] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const deleteGroup = useDeleteCommunity()
  const leaveGroup = useRemoveMember()
  const id = community.id
  const meta = visibilityMeta(community.visibility)
  const isAdmin = community.role === 'ADMIN'

  useEffect(() => {
    let active = true
    setLoading(true)
    setMessages([])
    api.getHistory(id, { limit: 30 })
      .then((res) => {
        if (!active) return
        setMessages(res.messages)
        setHasMore(res.hasMore)
        setLoading(false)
        qc.invalidateQueries({ queryKey: ['communities'] }) // loading latest marks read -> refresh unread badge
      })
      .catch(() => active && setLoading(false))
    return () => { active = false }
  }, [id, qc])

  // Receive live events routed from the page's single SSE stream.
  useEffect(() => {
    liveRef.current = {
      onMessage: (m) => {
        if (m.communityId !== id) return
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
        api.markRead(id, m.id).catch(() => {})
      },
      onDeleted: (p) => {
        if (p.communityId === id) setMessages((prev) => prev.filter((x) => x.id !== p.id))
      },
    }
    return () => { liveRef.current = null }
  }, [id, liveRef])

  const loadOlder = () => {
    if (!messages.length) return
    setLoadingOlder(true)
    api.getHistory(id, { beforeId: messages[0].id, limit: 30 })
      .then((res) => { setMessages((prev) => [...res.messages, ...prev]); setHasMore(res.hasMore); setLoadingOlder(false) })
      .catch(() => setLoadingOlder(false))
  }

  const send = (payload) => api.sendMessage(id, payload)
  const remove = (mid) => api.deleteMessage(id, mid).catch((e) => message.error(getErrorMessage(e)))

  const leave = () => leaveGroup.mutate({ id, memberId: currentUserId }, {
    onSuccess: () => { message.success('You left the group'); onLeft() },
    onError: (e) => message.error(getErrorMessage(e)),
  })
  const destroy = () => deleteGroup.mutate(id, {
    onSuccess: () => { message.success('Group deleted'); onLeft() },
    onError: (e) => message.error(getErrorMessage(e)),
  })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${BRAND.border}`, background: '#fff' }}>
        <InitialAvatar name={community.name} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: BRAND.heading, fontSize: 15 }}>{community.name}</div>
          <Space size={6} style={{ fontSize: 12, color: '#6B7A76' }}>
            <Tag icon={meta.icon} style={{ margin: 0 }}>{meta.label}</Tag>
            <span>{community.memberCount} members</span>
          </Space>
        </div>
        {isAdmin && <Button icon={<TeamOutlined />} onClick={onManage}>Members</Button>}
        {isAdmin ? (
          <Popconfirm title="Delete this group for everyone?" okButtonProps={{ danger: true }} onConfirm={destroy}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        ) : (
          <Popconfirm title="Leave this group?" onConfirm={leave}>
            <Button icon={<LogoutOutlined />}>Leave</Button>
          </Popconfirm>
        )}
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', background: BRAND.pageBg }}><Spin /></div>
      ) : (
        <MessageList messages={messages} currentUserId={currentUserId} hasMore={hasMore}
          loadingOlder={loadingOlder} onLoadOlder={loadOlder} onDelete={remove} />
      )}

      <MessageComposer communityId={id} onSend={send} />
    </div>
  )
}
