import { useEffect, useState } from 'react'
import { Avatar, Badge } from 'antd'

// Profile images are permission-guarded, so <img> can't load them directly (no token). We fetch
// each avatar once (with the token), cache the blob URL by fileId, and reuse it everywhere.
const avatarCache = new Map() // fileId -> Promise<blobUrl|null>

function loadAvatar(fileId) {
  if (avatarCache.has(fileId)) return avatarCache.get(fileId)
  const token = localStorage.getItem('token')
  const promise = fetch(`/api/v1/files/${fileId}`, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => (r.ok ? r.blob() : Promise.reject(new Error('avatar load failed'))))
    .then((blob) => URL.createObjectURL(blob))
    .catch(() => null)
  avatarCache.set(fileId, promise)
  return promise
}

function useAvatarUrl(fileId) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!fileId) {
      setUrl(null)
      return undefined
    }
    let active = true
    loadAvatar(fileId).then((u) => { if (active) setUrl(u) })
    return () => { active = false }
  }, [fileId])
  return url
}

// Initials from a person's name until a profile image exists; pass avatarFileId to show the photo.
function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// A stable on-brand teal shade per name, so avatars differ without looking colourful.
const SHADES = ['#0F766E', '#127C70', '#0E7490', '#155E63', '#1F7A6B', '#2B8A7A']
function shadeFor(name) {
  let hash = 0
  const text = name || ''
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  return SHADES[hash % SHADES.length]
}

export default function InitialAvatar({ name, avatarFileId, imageUrl, size = 40, online }) {
  const fetchedUrl = useAvatarUrl(avatarFileId)
  const src = imageUrl || fetchedUrl
  const avatar = (
    <Avatar
      size={size}
      src={src || undefined}
      style={{
        backgroundColor: src ? undefined : shadeFor(name),
        color: '#fff',
        fontWeight: 600,
        fontSize: Math.round(size * 0.4),
        flexShrink: 0,
      }}
    >
      {!src && initials(name)}
    </Avatar>
  )
  if (online === undefined) return avatar
  return (
    <Badge dot offset={[-5, size - 6]} color={online ? '#22C55E' : '#C2CBC8'} title={online ? 'Online' : 'Offline'}>
      {avatar}
    </Badge>
  )
}
