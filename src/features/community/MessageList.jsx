import { useEffect, useRef } from 'react'
import { Button, Popconfirm, Spin } from 'antd'
import { DeleteOutlined, FileOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import InitialAvatar from '../../components/common/InitialAvatar.jsx'
import { AuthedImage, openAuthedFile } from './AuthedFile.jsx'
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

// Non-image attachment: a compact card that opens the file (fetched with auth) in a new tab.
function FileCard({ id, name, mine }) {
  return (
    <button type="button" onClick={() => openAuthedFile(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', maxWidth: 240, width: '100%',
        background: mine ? 'rgba(255,255,255,0.18)' : 'rgba(15,118,110,0.07)',
        border: 'none', borderRadius: 8, color: 'inherit', cursor: 'pointer', textAlign: 'left',
      }}>
      <FileOutlined style={{ fontSize: 20, flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name || 'File'}</span>
    </button>
  )
}

function Bubble({ msg, mine, onDelete }) {
  const isImage = msg.type === 'IMAGE' && msg.attachmentId
  const isFile = msg.type === 'FILE' && msg.attachmentId
  const timeEl = (
    <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 'auto', alignSelf: 'flex-end', whiteSpace: 'nowrap', paddingLeft: 10, lineHeight: 1.6 }}>
      {time(msg.createdAt)}
    </span>
  )
  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', gap: 8, margin: '8px 0' }}>
      {!mine && <InitialAvatar name={msg.senderName} avatarFileId={msg.senderAvatarFileId} size={34} />}
      <div style={{ maxWidth: '72%' }}>
        {!mine && <div style={{ fontSize: 12, color: BRAND.primary, fontWeight: 600, marginBottom: 2 }}>{msg.senderName}</div>}
        <div
          style={{
            background: mine ? BRAND.primary : '#fff',
            color: mine ? '#fff' : '#20302C',
            border: mine ? 'none' : `1px solid ${BRAND.border}`,
            borderRadius: 14,
            borderTopRightRadius: mine ? 4 : 14,
            borderTopLeftRadius: mine ? 14 : 4,
            padding: isImage || isFile ? 5 : 0,
            boxShadow: '0 1px 1px rgba(16,40,36,0.05)',
            overflow: 'hidden',
          }}
        >
          {isImage && (
            <AuthedImage fileId={msg.attachmentId} alt={msg.attachmentName || 'image'}
              style={{ maxWidth: 240, borderRadius: 9, display: 'block' }} />
          )}
          {isFile && <FileCard id={msg.attachmentId} name={msg.attachmentName} mine={mine} />}
          {/* WhatsApp-style: text + time share the last line, time small and bottom-right */}
          <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', padding: isImage || isFile ? '4px 5px 0' : '6px 11px 5px' }}>
            {msg.body && <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.body}</span>}
            {timeEl}
          </div>
        </div>
      </div>
      {mine && (
        <Popconfirm title="Delete message?" onConfirm={() => onDelete(msg.id)}>
          <Button type="text" size="small" icon={<DeleteOutlined />} style={{ color: '#9AA7A3', alignSelf: 'center' }} />
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
      {loadingOlder && <div style={{ textAlign: 'center', padding: 8 }}><Spin size="small" /></div>}
      {messages.map((m) =>
        m.type === 'SYSTEM'
          ? <SystemLine key={m.id} body={m.body} />
          : <Bubble key={m.id} msg={m} mine={m.senderId === currentUserId} onDelete={onDelete} />,
      )}
    </div>
  )
}
