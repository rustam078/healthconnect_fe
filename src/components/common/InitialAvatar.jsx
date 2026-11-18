import { Avatar, Badge } from 'antd'

// Initials from a person's name until a profile image exists; pass imageUrl later to show the photo.
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

export default function InitialAvatar({ name, imageUrl, size = 40, online }) {
  const avatar = (
    <Avatar
      size={size}
      src={imageUrl || undefined}
      style={{
        backgroundColor: imageUrl ? undefined : shadeFor(name),
        color: '#fff',
        fontWeight: 600,
        fontSize: Math.round(size * 0.4),
        flexShrink: 0,
      }}
    >
      {!imageUrl && initials(name)}
    </Avatar>
  )
  if (online === undefined) return avatar
  return (
    <Badge dot offset={[-5, size - 6]} color={online ? '#22C55E' : '#C2CBC8'} title={online ? 'Online' : 'Offline'}>
      {avatar}
    </Badge>
  )
}
