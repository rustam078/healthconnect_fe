
import { useState } from 'react'
import { Row, Col, Empty, Tag, Space } from 'antd'
import { FilePdfOutlined } from '@ant-design/icons'
import PdfViewer from './PdfViewer.jsx'

export default function ReportsViewer({ reports = [], fileUrl, height = 800 }) {
  const [picked, setPicked] = useState(null)

  if (!reports.length) {
    return <Empty description="No reports linked to this visit" />
  }

  // Default to first report
  const active = picked && reports.some((r) => r.id === picked)
    ? picked
    : reports[0].id

  return (
    <div>
      {/* Horizontal report selection */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        {reports.map((r) => {
          const isActive = r.id === active

          return (
            <Tag
              key={r.id}
              icon={<FilePdfOutlined />}
              color={isActive ? 'cyan' : 'default'}
              onClick={() => setPicked(r.id)}
              style={{
                cursor: 'pointer',
                padding: '2px 10px',
                fontSize: 13,
                borderRadius: 10,
                fontWeight: isActive ? 600 : 400,
                border: isActive
                  ? '1px solid #0891b2'
                  : '1px solid #d9d9d9',
                marginInlineEnd: 0,
              }}
            >
              {r.title}
            </Tag>
          )
        })}
      </div>

      {/* Selected report PDF */}
      <Row>
        <Col span={24}>
          <PdfViewer url={fileUrl(active)} height={height} />
        </Col>
      </Row>
    </div>
  )
}
