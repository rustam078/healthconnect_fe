import { useState } from 'react'
import { Statistic, Table, Empty, Button, Typography } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Chart as ChartJS, registerables } from 'chart.js'
import { enumLabel } from '../../constants/enums.js'
import { Bar, Line, Pie } from 'react-chartjs-2'

ChartJS.register(...registerables) // one-time Chart.js setup

// How many bars or points a chart shows at once before it starts paging.
//
// Chart.js will happily draw forty bars in a card this size, but they come out as hairlines
// with unreadable labels. Showing a fixed window and letting the reader step through it
// keeps every bar the same comfortable width however many rows the query returns.
const CHART_WINDOW = 8

// Draws a widget's rows according to its type. Shared by the board card and the gallery
// preview card so the two can never drift apart.
//   COUNT -> a big number, TABLE -> a table, BAR/LINE/PIE -> a chart.
export default function WidgetBody({
  type,
  rows = [],
  compact = false,
  page = 1,
  pageSize = 5,
  total,
  onPageChange,
}) {
  // Which slice of a paged chart is on screen. Declared before the early returns because
  // hooks cannot live inside a branch; the other widget types simply never read it.
  const [windowStart, setWindowStart] = useState(0)

  if (rows.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />
  }

  const columns = Object.keys(rows[0])

  if (type === 'COUNT') {
    // One big number, centred in the card and bold - a score is meant to be read at a
    // glance from across the room, not scanned for. It fills the cell height so the number
    // stays centred however tall the widget is dragged.
    return (
      <div
        // No minimum height on a board card: the cell already has a definite height, and
        // a floor taller than a short cell made a single number overflow and grow a
        // scrollbar. The gallery's preview box is a fixed 130px, so it keeps its floor.
        style={{
          height: '100%',
          minHeight: compact ? 90 : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Statistic
          value={enumLabel(rows[0][columns[0]])}
          valueStyle={{ fontSize: compact ? 30 : 48, fontWeight: 700, lineHeight: 1.1 }}
        />
      </div>
    )
  }

  if (type === 'TABLE') {
    // Cells go through enumLabel, so a stored A_NEGATIVE reads as A- here exactly as it
    // does on the patients page. Doing it once in the renderer beats asking every query to
    // prettify its own enums - that would be the same REPLACE() copied into every widget.
    const tableCols = columns.map((c) => ({
      title: c,
      dataIndex: c,
      key: c,
      render: (value) => enumLabel(value),
    }))
    const dataSource = rows.map((r, i) => ({ key: i, ...r }))
    return (
      <Table
        size="small"
        columns={tableCols}
        dataSource={dataSource}
        // The rows ARE the page - the server was asked for exactly these. antd is told the
        // real total so it can draw page numbers, and told not to slice anything itself.
        pagination={
          compact
            ? false
            : {
                current: page,
                pageSize,
                total: total ?? rows.length,
                onChange: onPageChange,
                showSizeChanger: false,
                size: 'small',
                showTotal: (t, range) => `${range[0]}-${range[1]} of ${t}`,
              }
        }
        scroll={{ x: true }}
      />
    )
  }

  // charts: use the first column as labels and the second as numeric values
  const labelCol = columns[0]
  const valueCol = columns[1] ?? columns[0]

  // Paging is for the board only. The gallery's preview is a 130px thumbnail nobody reads
  // values off, and arrows in it would be bigger than the bars they scroll.
  const paged = !compact && (type === 'BAR' || type === 'LINE') && rows.length > CHART_WINDOW
  // Clamped rather than reset: a widget that refetches fewer rows than last time would
  // otherwise leave the window pointing past the end and draw an empty chart.
  const lastStart = Math.max(0, rows.length - CHART_WINDOW)
  const start = paged ? Math.min(windowStart, lastStart) : 0
  const shown = paged ? rows.slice(start, start + CHART_WINDOW) : rows

  const chartData = {
    labels: shown.map((r) => enumLabel(r[labelCol])),
    datasets: [
      {
        label: valueCol,
        data: shown.map((r) => Number(r[valueCol]) || 0),
        backgroundColor: ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2', '#fa541c'],
      },
    ],
  }

  // maintainAspectRatio must be OFF inside a sized box. With it on, Chart.js keeps its own
  // ratio and either overflows or leaves dead space when the box changes shape.
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: type === 'PIE' && !compact } },
  }

  const chart =
    type === 'BAR' ? <Bar data={chartData} options={options} />
    : type === 'LINE' ? <Line data={chartData} options={options} />
    : type === 'PIE' ? <Pie data={chartData} options={options} />
    : null

  if (!chart) return <Empty description={`Unsupported type: ${type}`} />

  if (!paged) {
    return (
      <div style={{ position: 'relative', height: '100%', minHeight: compact ? 90 : 0 }}>
        {chart}
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* The chart takes the height that is left, so adding the controls shortens the bars
          rather than pushing them out of the card. */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>{chart}</div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingTop: 4,
          flex: '0 0 auto',
        }}
      >
        <Button
          size="small"
          type="text"
          icon={<LeftOutlined />}
          disabled={start === 0}
          onClick={() => setWindowStart(Math.max(0, start - CHART_WINDOW))}
          aria-label="Show earlier values"
        />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {start + 1}-{start + shown.length} of {rows.length}
        </Typography.Text>
        <Button
          size="small"
          type="text"
          icon={<RightOutlined />}
          disabled={start >= lastStart}
          onClick={() => setWindowStart(Math.min(lastStart, start + CHART_WINDOW))}
          aria-label="Show later values"
        />
      </div>
    </div>
  )
}
