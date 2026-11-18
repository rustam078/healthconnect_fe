import { useEffect, useRef } from 'react'
import { Button, Popconfirm, Spin, Image } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import InitialAvatar from '../../components/common/InitialAvatar.jsx'
import { BRAND } from '../../app/theme.js'

const time = (ts) => (ts ? dayjs(ts).format('HH:mm') : '')

function SystemLine({ body }) {
  return (
    <div style={{ textAlign: 'center', margin: '10px 0' }}>
      <span style={{ background: '#E7F0EE', color: '#5B6B67', fontSize: 12, padding: '3px 12px', borderRadius: 12 }}>
        {body}
      </span>
    </div>
  )
}

function Bubble({ msg, mine, onDelete }) {
  const align = mine ? 'flex-end' : 'flex-start'
  return (
    <div style={{ display: 'flex', justifyContent: align, gap: 8, margin: '8px 0' }}>
      {!mine && <InitialAvatar name={msg.senderName} size={34} />}
      <div style={{ maxWidth: '72%' }}>
        {!mine && <div style={{ fontSize: 12, color: BRAND.primary, fontWeight: 600, marginBottom: 2 }}>{msg.senderName}</div>}
        <div
          className="chat-bubble"
          style={{
            background: mine ? BRAND.primary : '#fff',
            color: mine ? '#fff' : '#20302C',
            border: mine ? 'none' : `1px solid ${BRAND.border}`,
            borderRadius: 14,
            borderTopRightRadius: mine ? 4 : 14,
            borderTopLeftRadius: mine ? 14 : 4,
            padding: msg.attachmentId ? 6 : '8px 12px',
            boxShadow: '0 1px 1px rgba(16,40,36,0.05)',
          }}
        >
          {msg.attachmentId && (
            <Image src={`/api/v1/files/${msg.attachmentId}`} alt="attachment"
              style={{ maxWidth: 240, borderRadius: 10, display: 'block' }} />
          )}
          {msg.body && <div style={{ padding: msg.attachmentId ? '6px 6px 2px' : 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.body}</div>}
          <div style={{ fontSize: 10, textAlign: 'right', marginTop: 2, opacity: 0.65 }}>{time(msg.createdAt)}</div>
        </div>
      </div>
      {mine && (
        <Popconfirm title="Delete message?" onConfirm={() => onDelete(msg.id)}>
          <Button type="text" size="small" className="del-btn" icon={<DeleteOutlined />} style={{ color: '#9AA7A3', alignSelf: 'center' }} />
        </Popconfirm>
      )}
    </div>
  )
}

export default function MessageList({ messages, currentUserId, hasMore, loadingOlder, onLoadOlder, onDelete }) {
  const scrollRef = useRef(null)
  const prevHeight = useRef(0)
  const lastId = useRef(null)

  // Keep the viewport pinned to newest on a new message; preserve position when older ones prepend.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const newest = messages[messages.length - 1]?.id
    if (loadingOlder) return
    if (prevHeight.current && el.scrollHeight > prevHeight.current && newest !== lastId.current) {
      el.scrollTop = el.scrollHeight
    }
    if (lastId.current === null) el.scrollTop = el.scrollHeight
    lastId.current = newest
    prevHeight.current = el.scrollHeight
  }, [messages, loadingOlder])

  const onScroll = (e) => {
    if (e.target.scrollTop < 60 && hasMore && !loadingOlder) {
      prevHeight.current = e.target.scrollHeight
      onLoadOlder()
    }
  }

  return (
    <div ref={scrollRef} onScroll={onScroll} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', background: BRAND.pageBg }}>
      <style>{`.chat-bubble .del-btn{opacity:0} .del-btn{transition:opacity .15s}`}</style>
      {loadingOlder && <div style={{ textAlign: 'center', padding: 8 }}><Spin size="small" /></div>}
      {messages.map((m) =>
        m.type === 'SYSTEM'
          ? <SystemLine key={m.id} body={m.body} />
          : <Bubble key={m.id} msg={m} mine={m.senderId === currentUserId} onDelete={onDelete} />,
      )}
    </div>
  )
}
