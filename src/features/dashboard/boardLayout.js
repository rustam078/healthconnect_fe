// Pure helpers for the board's 3-column grid. No React, no network - just maths on the
// item list, so the components stay about wiring rather than layout arithmetic.

export const COLS = 3
export const DEFAULT_H = 4      // matches BoardService.DEFAULT_HEIGHT on the backend
export const ROW_HEIGHT = 80    // pixels per grid row unit

// The row below everything currently on the board.
function bottomOf(items) {
  return items.reduce((lowest, item) => Math.max(lowest, (item.y || 0) + (item.h || DEFAULT_H)), 0)
}

// Append widgets under what is already there, packing them 3 to a row rather than
// stacking each on its own row. Widgets already on the board are skipped, so this is
// safe to call with a selection that overlaps the current board.
//
// `widgets` are gallery widgets ({ id, code, name, type }), NOT board items -
// the id lives under `id` there and becomes `widgetId` here.
export function appendPacked(items = [], widgets = []) {
  const next = [...items]
  let x = 0
  let y = bottomOf(items)

  for (const widget of widgets) {
    if (next.some((item) => item.widgetId === widget.id)) {
      continue
    }
    if (x + 1 > COLS) {   // row is full - start the next one
      x = 0
      y += DEFAULT_H
    }
    next.push({
      widgetId: widget.id,
      code: widget.code,
      name: widget.name,
      type: widget.type,
      x,
      y,
      w: 1,
      h: DEFAULT_H,
    })
    x += 1
  }
  return next
}

// Fold react-grid-layout's [{i,x,y,w,h}] back onto our items. RGL keys by a STRING id,
// ours is a number, hence the String() on both sides.
export function applyRglLayout(items = [], rglLayout = []) {
  const byId = new Map(rglLayout.map((entry) => [String(entry.i), entry]))
  return items.map((item) => {
    const entry = byId.get(String(item.widgetId))
    return entry ? { ...item, x: entry.x, y: entry.y, w: entry.w, h: entry.h } : item
  })
}

// The shape the backend wants: position only, no widget details.
export function toSavePayload(items = []) {
  return items.map((item) => ({
    widgetId: item.widgetId,
    x: item.x ?? 0,
    y: item.y ?? 0,
    w: item.w ?? 1,
    h: item.h ?? DEFAULT_H,
  }))
}
