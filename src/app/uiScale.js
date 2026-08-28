// The whole app is rendered at a zoom factor set in global.css. CSS owns that
// number; anything in JS that has to convert between screen pixels and the
// app's own pixels (drag maths, mostly) reads it back from there so the two can
// never disagree. Read on first call rather than at import time - modules are
// evaluated before the stylesheet is in the document.
let cached

export function uiScale() {
  if (cached === undefined) {
    const declared = getComputedStyle(document.documentElement).getPropertyValue('--ui-scale')
    cached = Number.parseFloat(declared) || 1
  }
  return cached
}
