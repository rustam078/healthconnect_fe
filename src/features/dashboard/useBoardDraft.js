import { useCallback, useMemo, useState } from 'react'
import { appendPacked, applyRglLayout, toSavePayload } from './boardLayout.js'

// Holds the board layout you are editing, before it is saved.
//
// This lives in its own file rather than inside DashboardPage for two reasons: the page
// stays a thin orchestrator instead of growing into a 400-line file, and the placement
// logic ends up somewhere it can be reasoned about on its own.
//
// About `revision`: BoardGrid must be remounted when the layout changes for a reason
// OTHER than a drag, because react-grid-layout ignores `layout` prop changes after mount.
// So revision is bumped by reset/add/remove - and deliberately NOT by applyLayout, since
// remounting mid-drag would kill the drag.
export function useBoardDraft(board) {
  const [items, setItems] = useState([])
  const [revision, setRevision] = useState(0)

  // Copy the saved board into the draft. Called when entering edit mode and on cancel.
  const reset = useCallback(() => {
    setItems(board?.items ?? [])
    setRevision((r) => r + 1)
  }, [board])

  const addWidgets = useCallback((widgets) => {
    setItems((current) => appendPacked(current, widgets))
    setRevision((r) => r + 1)
  }, [])

  const removeWidget = useCallback((widgetId) => {
    setItems((current) => current.filter((item) => item.widgetId !== widgetId))
    setRevision((r) => r + 1)
  }, [])

  // Drag / resize. No revision bump: the grid already shows this, and remounting would
  // interrupt the gesture.
  const applyLayout = useCallback((rglLayout) => {
    setItems((current) => applyRglLayout(current, rglLayout))
  }, [])

  // Compare only what actually gets saved - name/code/type are not editable here.
  const isDirty = useMemo(() => {
    const saved = JSON.stringify(toSavePayload(board?.items ?? []))
    const draft = JSON.stringify(toSavePayload(items))
    return saved !== draft
  }, [board, items])

  return { items, revision, isDirty, addWidgets, removeWidget, applyLayout, reset }
}
