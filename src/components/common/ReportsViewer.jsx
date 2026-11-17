import { useState } from 'react'
import { Row, Col, List, Empty, Typography } from 'antd'
import { FilePdfOutlined } from '@ant-design/icons'
import PdfViewer from './PdfViewer.jsx'

// Shows a set of reports: a selectable list on the left, the chosen PDF on the right.
// With one report it just shows it; with none it shows an empty state. `fileUrl(id)` builds
// the per-report file URL (patient and doctor endpoints differ).
export default function ReportsViewer({ reports = [], fileUrl, height = 520 }) {
  const [picked, setPicked] = useState(null)

  if (!reports.length) {
    return <Empty description="No reports linked to this visit" />
  }

  // Fall back to the first report so a PDF always shows, even before anything is clicked.
  const active = picked && reports.some((r) => r.id === picked) ? picked : reports[0].id

  return (
    <Row gutter={12} wrap>
      <Col flex="220px" style={{ minWidth: 200 }}>
        <List
          size="small"
          bordered
          dataSource={reports}
          renderItem={(r) => (
            <List.Item
              onClick={() => setPicked(r.id)}
              style={{
                cursor: 'pointer',
                background: r.id === active ? '#e6f4f1' : undefined,
              }}
            >
              <List.Item.Meta
                avatar={<FilePdfOutlined style={{ color: '#0b7285' }} />}
                title={<Typography.Text ellipsis={{ tooltip: r.title }}>{r.title}</Typography.Text>}
                description={
                  <Typography.Text type="secondary" ellipsis style={{ fontSize: 12 }}>
                    {r.originalFileName}
                  </Typography.Text>
                }
              />
            </List.Item>
          )}
        />
      </Col>
      <Col flex="auto" style={{ minWidth: 260 }}>
        <PdfViewer url={fileUrl(active)} height={height} />
      </Col>
    </Row>
  )
}
