import { useEffect, useState } from 'react'
import { Image, Spin } from 'antd'

// File serving is permission-guarded (not a public URL), and native <img>/<a> requests cannot send
// the Bearer token. So we fetch the file with the token, turn it into a blob URL, and show that —
// the token stays in the request header, never in the URL.
function useAuthedBlobUrl(fileId) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let objectUrl = null
    let active = true
    const token = localStorage.getItem('token')
    fetch(`/api/v1/files/${fileId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error('load failed'))))
      .then((blob) => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {})
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [fileId])
  return url
}

export function AuthedImage({ fileId, alt, style }) {
  const url = useAuthedBlobUrl(fileId)
  if (!url) {
    return (
      <div style={{ width: 180, height: 120, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.05)', borderRadius: 9 }}>
        <Spin size="small" />
      </div>
    )
  }
  return <Image src={url} alt={alt} style={style} />
}

// Opens a non-image file (pdf/doc) in a new tab. The tab is opened synchronously (so it is not
// popup-blocked), then pointed at the fetched blob once it loads.
export async function openAuthedFile(fileId) {
  const tab = window.open('', '_blank')
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/v1/files/${fileId}`, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) {
      if (tab) tab.close()
      return
    }
    const url = URL.createObjectURL(await res.blob())
    if (tab) tab.location = url
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch {
    if (tab) tab.close()
  }
}
