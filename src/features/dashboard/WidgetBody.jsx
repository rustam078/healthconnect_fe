import { Statistic, Table, Empty } from 'antd'
import { Chart as ChartJS, registerables } from 'chart.js'
import { Bar, Line, Pie } from 'react-chartjs-2'

ChartJS.register(...registerables) // one-time Chart.js setup

// Draws a widget's rows according to its type. Shared by the board card and the gallery
// preview card so the two can never drift apart.
//   COUNT -> a big number, TABLE -> a table, BAR/LINE/PIE -> a chart.
export default function WidgetBody({ type, rows = [], compact = false }) {
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
          value={rows[0][columns[0]]}
          valueStyle={{ fontSize: compact ? 30 : 48, fontWeight: 700, lineHeight: 1.1 }}
        />
      </div>
    )
  }

  if (type === 'TABLE') {
    const tableCols = columns.map((c) => ({ title: c, dataIndex: c, key: c }))
    const dataSource = rows.map((r, i) => ({ key: i, ...r }))
    return (
      <Table
        size="small"
        columns={tableCols}
        dataSource={dataSource}
        pagination={compact ? false : { pageSize: 5 }}
        scroll={{ x: true }}
      />
    )
  }

  // charts: use the first column as labels and the second as numeric values
  const labelCol = columns[0]
  const valueCol = columns[1] ?? columns[0]
  const chartData = {
    labels: rows.map((r) => r[labelCol]),
    datasets: [
      {
        label: valueCol,
        data: rows.map((r) => Number(r[valueCol]) || 0),
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
  return (
    <div style={{ position: 'relative', height: '100%', minHeight: compact ? 90 : 0 }}>
      {chart}
    </div>
  )
}
