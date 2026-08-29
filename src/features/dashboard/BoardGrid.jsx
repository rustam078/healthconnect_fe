import { useMemo } from 'react'
import { Empty } from 'antd'
import GridLayout, { setTransform, useContainerWidth, verticalCompactor } from 'react-grid-layout'
import WidgetCard from './WidgetCard.jsx'
import { COLS, ROW_HEIGHT } from './boardLayout.js'
import { uiScale } from '../../app/uiScale.js'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

// Draws the widgets of one board on a 3-column grid. The SAME component renders the saved
// board and the editable draft - only `editable` differs - so the board cannot shift
// position when you enter edit mode.
//
// This is react-grid-layout v2, whose props differ from the v1 API most examples show:
// there is no WidthProvider (useContainerWidth replaces it), and cols/rowHeight/margin/
// isDraggable/isResizable/compactType all moved into config objects.
//
// TWO THINGS THAT WILL BITE YOU:
//
// 1. measureBeforeMount: true is required. Without it useContainerWidth reports its
//    default width of 1280 on the first render and the third column hangs off the edge.
//
// 2. The app is zoomed out (see global.css), and mouse coordinates arrive in screen
//    pixels while the grid positions its items in the app's own smaller pixels. Without
//    the scaled strategy a dragged widget trails behind the cursor by that difference.
//
// 3. `layout` is the INITIAL layout only - after mount GridLayout keeps its own state and
//    ignores the prop. So the grid is remounted via `layoutKey`. The CALLER owns that key
//    precisely because the right moment to remount differs between modes: in view mode
//    any change should remount, but in edit mode remounting on a drag would kill the drag.

export default function BoardGrid({
  items = [],
  layoutKey = 'static',
  editable = false,
  onLayoutChange,
  onRemove,
  boardFilters,
  boardFilterLabels,
}) {
  const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: true })

  // Positioning itself is the library default (CSS transforms). The point of spelling the
  // strategy out is `scale`: it is what the grid divides incoming mouse pixels by.
  const positionStrategy = useMemo(
    () => ({ type: 'transform', scale: uiScale(), calcStyle: setTransform }),
    [],
  )

  // react-grid-layout wants its own array, keyed by a STRING id.
  const layout = useMemo(
    () =>
      items.map((item) => ({
        i: String(item.widgetId),
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: 1,
        minH: 2,
      })),
    [items],
  )

  if (items.length === 0) {
    return <Empty description="This board is empty. Add some widgets to get started." />
  }

  return (
    <div ref={containerRef}>
      {mounted && (
        <GridLayout
          key={layoutKey}
          className="layout"
          layout={layout}
          width={width}
          gridConfig={{ cols: COLS, rowHeight: ROW_HEIGHT, margin: [16, 16] }}
          // Buttons and scrollable tables inside a card must not start a drag.
          dragConfig={{ enabled: editable, cancel: '.ant-btn, .ant-table-wrapper, .ant-popover' }}
          resizeConfig={{ enabled: editable }}
          compactor={verticalCompactor}
          positionStrategy={positionStrategy}
          onLayoutChange={editable ? onLayoutChange : undefined}
        >
          {items.map((item) => (
            <div key={String(item.widgetId)}>
              <WidgetCard
                item={item}
                editable={editable}
                onRemove={onRemove}
                boardFilters={boardFilters}
                boardFilterLabels={boardFilterLabels}
              />
            </div>
          ))}
        </GridLayout>
      )}
    </div>
  )
}
