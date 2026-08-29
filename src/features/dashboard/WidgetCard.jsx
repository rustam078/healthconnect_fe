import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, Spin, Alert, Popconfirm, Button, Popover, Badge, Space, Tag } from 'antd'
import { DeleteOutlined, HolderOutlined, FilterOutlined } from '@ant-design/icons'
import { useWidgetData } from './boardsHooks.js'
import WidgetBody from './WidgetBody.jsx'
import WidgetFilters, { parseFilterConfig } from './WidgetFilters.jsx'

// Breathing room left under the last row so it never sits flush against the pager. Row
// and header heights are MEASURED, not assumed - a cell wraps at a narrow card width, and
// the same table is 39px a row in one card and 75px in another.
const TABLE_GUTTER_PX = 12

// Renders ONE widget on a board. It fetches its own data and hands the rows to WidgetBody.
//
// In edit mode it also shows a drag handle and a remove button. Width and height come from
// dragging the card's edges now, so there is no width control here any more.
export default function WidgetCard({ item, editable = false, onRemove, boardFilters, boardFilterLabels }) {
  // The board hands the widget's filter settings down with the item, so a card knows what
  // it can be filtered by without a request of its own.
  const filterRules = useMemo(() => parseFilterConfig(item.filters), [item.filters])
  const [filters, setFilters] = useState({})
  const [ownLabels, setOwnLabels] = useState({})

  // The board's values reach every card, but a card only takes the ones it declares - a
  // parameter no blank in its SQL matches would simply be ignored, and passing it on would
  // make the card look filtered when it is not. Its own choice wins on a shared id.
  const effective = useMemo(() => {
    const inherited = {}
    for (const rule of filterRules) {
      if (boardFilters?.[rule.id] !== undefined) inherited[rule.id] = boardFilters[rule.id]
    }
    return { ...inherited, ...filters }
  }, [filterRules, boardFilters, filters])

  const chips = useMemo(
    () =>
      Object.keys(effective)
        .map((key) => ownLabels[key] ?? boardFilterLabels?.[key])
        .filter(Boolean),
    [effective, ownLabels, boardFilterLabels],
  )

  const activeFilterCount = Object.keys(effective).length

  // How many rows fit in the space this card actually has.
  //
  // The card's height is already yours to set by dragging, and it is already saved with the
  // layout - so it decides the page size rather than a separate setting that could disagree
  // with it. No blank half-card, no scrollbar, and a taller card simply shows more rows.
  const bodyRef = useRef(null)
  const [rowsThatFit, setRowsThatFit] = useState(5)
  const isTable = item.type === 'TABLE'


  const [page, setPage] = useState(1)
  const pageSize = isTable ? rowsThatFit : 50

  // Back to page one whenever the rows underneath change meaning: page 7 of an unfiltered
  // list is not page 7 of a filtered one.
  useEffect(() => setPage(1), [effective, pageSize])

  const { data, isLoading, error } = useWidgetData(item.code, pageSize, effective, page, isTable)
  const rows = data?.rows ?? []

  useEffect(() => {
    const el = bodyRef.current
    if (!el || !isTable) return undefined

    const measure = () => {
      // The card BODY is what has the height. The wrapper this ref sits on is height:100%
      // inside a flex item, which collapses to its content - it would report no spare room
      // in a card twice as tall as its table.
      const box = el.closest('.ant-card-body') ?? el
      const dataRows = [...el.querySelectorAll('.ant-table-tbody tr')].filter(
        (r) => !r.className.includes('measure-row'),
      )
      if (dataRows.length === 0) return

      // The TALLEST row on screen, not the average: cells wrap when a card is narrow, so
      // the same table is 39px a row in one card and 75px in another.
      // offsetHeight, not getBoundingClientRect: the app renders at a CSS zoom, so a rect is
      // in VISUAL pixels while scrollHeight and clientHeight below are in CSS pixels.
      // Mixing the two made every correction 10% out.
      const rowHeight = Math.max(...dataRows.map((r) => r.offsetHeight))
      if (rowHeight <= 0) return

      // The TABLE against the SPACE, not the box against its own content.
      //
      // The box always reports scrollHeight === clientHeight here, because the wrapper
      // inside it is height:100% and fills whatever room there is - so a card twice as tall
      // as its table still looks "exactly full". Measuring the table itself is the only
      // thing that sees the empty half.
      const table = el.querySelector('.ant-table-wrapper')
      if (!table) return
      const available = box.clientHeight
      const used = table.offsetHeight
      const shown = dataRows.length

      if (used > available) {
        const drop = Math.ceil((used - available + TABLE_GUTTER_PX) / rowHeight)
        setRowsThatFit(Math.max(1, shown - Math.max(1, drop)))
        return
      }
      // Room to spare: grow, leaving the gutter so the last row never sits flush against
      // the pager.
      const spare = available - used - TABLE_GUTTER_PX
      if (spare >= rowHeight) {
        setRowsThatFit(shown + Math.floor(spare / rowHeight))
      }
    }

    measure()
    // Dragging a card's edge changes the height without remounting anything, so the page
    // size follows the box rather than being read once on mount. Row heights settle a beat
    // after the rows render, hence the second look.
    const settle = setTimeout(measure, 120)
    const observer = new ResizeObserver(measure)
    observer.observe(el.closest('.ant-card-body') ?? el)
    return () => {
      clearTimeout(settle)
      observer.disconnect()
    }
  // rowsThatFit is a dependency ON PURPOSE: each adjustment re-measures, so the count walks
  // to the right answer instead of stopping after one step. It settles because growing
  // shrinks the spare room and shrinking removes the overflow.
  }, [isTable, rows, rowsThatFit])

  return (
    <Card
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {item.name}
          {/* What this card is currently filtered by, so a narrowed number is never
              mistaken for the whole picture once the popover is shut. */}
          {chips.map((chip) => (
            <Tag key={chip} style={{ margin: 0, fontWeight: 400 }}>
              {chip}
            </Tag>
          ))}
        </span>
      }
      size="small"
      // Fill the grid cell: the cell has a fixed pixel height, and the body scrolls
      // rather than the card overflowing it.
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, overflow: 'auto' } }}
      classNames={{ body: 'hide-scrollbar' }}
      extra={
        <Space size={4}>
          {/* Filters live in the title row, behind an icon: a card is mostly body, and a
              row of controls permanently occupying the top of it steals the space the
              chart or table was given. The dot marks a card whose numbers are filtered,
              so a reader never mistakes a narrowed result for the whole picture. */}
          {!editable && filterRules.length > 0 && (
            <Popover
              trigger="click"
              placement="bottomRight"
              title="Filters"
              content={
                <div style={{ width: 260 }}>
                  <WidgetFilters
                    rules={filterRules}
                    appliedValues={filters}
                    appliedLabels={ownLabels}
                    onApply={(next, display) => {
                      setFilters(next)
                      setOwnLabels(display)
                    }}
                  />
                </div>
              }
            >
              <Badge dot={activeFilterCount > 0} offset={[-2, 2]}>
                <Button
                  size="small"
                  type={activeFilterCount > 0 ? 'primary' : 'text'}
                  icon={<FilterOutlined />}
                />
              </Badge>
            </Popover>
          )}
          {editable && (
            <Popconfirm title="Remove from board?" onConfirm={() => onRemove(item.widgetId)}>
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      }
    >
      {/* The measured box: it fills the card body, so its height IS the space the table
          has to work with. */}
      <div ref={bodyRef} style={{ height: '100%' }}>
      {editable && (
        // The whole card is draggable; this just tells the user so.
        <div style={{ textAlign: 'center', color: '#bbb', lineHeight: 1, marginBottom: 4 }}>
          <HolderOutlined />
        </div>
      )}
      {isLoading ? (
        <Spin />
      ) : error ? (
        <Alert type="error" message={error.message || 'Failed to load'} />
      ) : (
        <WidgetBody
          type={item.type}
          rows={rows}
          page={page}
          pageSize={pageSize}
          total={data?.totalElements}
          onPageChange={setPage}
        />
      )}
      </div>
    </Card>
  )
}
