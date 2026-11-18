import { useRef, useState } from 'react'
import { Input, Button, Tag, App } from 'antd'
import { SendOutlined, PaperClipOutlined } from '@ant-design/icons'
import { uploadChatFile } from './communityApi.js'
import { getErrorMessage } from '../../utils/apiError.js'
import { BRAND } from '../../app/theme.js'

// Text + optional image. The image is uploaded first (two-step), then sent as an attachment.
export default function MessageComposer({ communityId, onSend }) {
  const { message } = App.useApp()
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const inputRef = useRef(null)

  const onFile = async (e) => {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (!picked) return
    setUploading(true)
    try {
      const res = await uploadChatFile(communityId, picked)
      setFile({ id: res.id, filename: res.filename })
    } catch (err) {
      message.error(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  const submit = async () => {
    if (!text.trim() && !file) return
    setSending(true)
    try {
      await onSend({ message: text.trim() || undefined, fileId: file?.id })
      setText('')
      setFile(null)
    } catch (err) {
      message.error(getErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ borderTop: `1px solid ${BRAND.border}`, padding: '12px 16px', background: '#fff' }}>
      {file && (
        <Tag closable color="cyan" onClose={() => setFile(null)} style={{ marginBottom: 8 }}>
          📎 {file.filename}
        </Tag>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <Button icon={<PaperClipOutlined />} loading={uploading} onClick={() => inputRef.current?.click()}
          style={{ flexShrink: 0 }} />
        <Input.TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
          autoSize={{ minRows: 1, maxRows: 5 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
        />
        <Button type="primary" icon={<SendOutlined />} loading={sending} onClick={submit} style={{ flexShrink: 0 }} />
      </div>
      <input ref={inputRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" hidden onChange={onFile} />
    </div>
  )
}
