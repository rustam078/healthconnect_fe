import { useEffect, useState } from 'react'
import { Spin, Alert, Button, Space } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import axiosClient from '../../api/axiosClient.js'

// Fetches a PDF (with the auth header) and previews it INLINE. `url` is an API path that
// returns application/pdf (e.g. /customer-portal/reports/5/file). Download stays available.
export default function PdfViewer({ url, height = 600, fileName = 'document.pdf' }) {
  const [blobUrl, setBlobUrl] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let objectUrl = null
    setLoading(true)
    setError(null)
    axiosClient
      .get(url, { responseType: 'blob' })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
      })
      .catch((e) => setError(e.message || 'Failed to load the document'))
      .finally(() => setLoading(false))
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])

  if (loading) return <Spin />
  if (error) return <Alert type="error" message={error} />

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={8}>
      <iframe title="PDF preview" src={blobUrl} style={{ width: '100%', height, border: '1px solid #eee' }} />
      <Button icon={<DownloadOutlined />} href={blobUrl} download={fileName}>
        Download
      </Button>
    </Space>
  )
}
