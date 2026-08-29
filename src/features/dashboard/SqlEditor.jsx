import { useEffect, useMemo, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { sql as sqlLang, MySQL } from '@codemirror/lang-sql'
import { linter, lintGutter } from '@codemirror/lint'
import { EditorView } from '@codemirror/view'
import pkg from 'node-sql-parser'

const { Parser } = pkg

// Never let a drag collapse the box to a sliver you cannot read a query in.
const MIN_HEIGHT = 120
const parser = new Parser()

// A widget's SQL is a TEMPLATE, not SQL:
//   :doctorId   a value blank the engine binds
//   {{op}}      an operator blank
// A parser fed those raw would call every real widget a syntax error, so both are masked
// before parsing.
//
// The mask is PADDED TO THE SAME LENGTH as what it replaces. That is the whole trick: the
// parser reports errors as character offsets, and equal lengths mean an offset in the
// masked text is the same offset in what is actually on screen. Substituting a shorter
// filler would slide every error marker left of the word it belongs to.
function maskTemplate(text) {
  return text
    .replace(/\{\{\s*\w+\s*\}\}/g, (match) => '='.padEnd(match.length))
    .replace(/:\w+/g, (match) => '1'.padEnd(match.length))
}

// Underlines the spot where the query stops making sense.
//
// Advisory only - it never blocks Run preview or Save. The database is the authority on
// whether a query works, and the dry run is what asks it; this just catches a typo before
// you make the round trip. Checked against every widget in the library: none is flagged.
const sqlLinter = linter((view) => {
  const text = view.state.doc.toString()
  if (!text.trim()) return []

  try {
    parser.astify(maskTemplate(text), { database: 'mysql' })
    return []
  } catch (error) {
    const offset = error?.location?.start?.offset
    // No position means the parser could not even say where it gave up. Marking the whole
    // query red then would be noise, so it is left alone and the dry run reports it.
    if (typeof offset !== 'number') return []

    const from = Math.min(offset, text.length)
    return [
      {
        from,
        // A zero-width mark is invisible, so a marker at the very end covers the last
        // character instead.
        to: Math.min(from + 1, text.length) || text.length,
        severity: 'error',
        message: String(error.message).split('\n')[0],
      },
    ]
  }
})

// The query box on the New widget tab.
//
// A textarea gave no sense of where a clause ended or which word was a keyword. This is a
// real editor: MySQL highlighting, line numbers, bracket matching, and a red underline
// under a syntax error as you type.
export default function SqlEditor({ value, onChange, disabled = false, height = 200 }) {
  const boxRef = useRef(null)

  // Escape must not reach the drawer.
  //
  // The drawer closes on Escape, and closing it clears the form - so a stray Escape while
  // writing a query threw the whole widget away. In a plain textarea nobody pressed it; in
  // an editor it is the normal way to dismiss the autocomplete popup.
  //
  // A NATIVE listener, not React's onKeyDown: React attaches at the root container, above
  // the drawer, so by the time a React handler could stop the event the drawer has already
  // seen it. This sits inside the drawer and stops it on the way up. CodeMirror's own
  // Escape handling has already run by then, so the popup still closes.
  useEffect(() => {
    const el = boxRef.current
    if (!el) return undefined
    const swallowEscape = (event) => {
      if (event.key === 'Escape') event.stopPropagation()
    }
    el.addEventListener('keydown', swallowEscape)
    return () => el.removeEventListener('keydown', swallowEscape)
  }, [])

  const extensions = useMemo(
    () => [
      // The MySQL dialect, so backtick quoting and its keywords are understood.
      sqlLang({ dialect: MySQL, upperCaseKeywords: true }),
      sqlLinter,
      lintGutter(),
      // Wrap rather than scroll sideways: a widget query is long lines of SELECT columns,
      // and reading one a screen at a time horizontally is worse than a wrapped line.
      EditorView.lineWrapping,
    ],
    [],
  )

  return (
    // Drag the bottom-right corner to make the box taller, the way a textarea does.
    //
    // The HEIGHT lives here and the editor is told to fill it, rather than the editor
    // owning a fixed height - resizing a wrapper around a fixed-height editor would move
    // the border and leave the query where it was.
    //
    // Vertical only: the width belongs to the form column, and a box dragged wider than
    // the drawer would just hang off the side of it.
    <div
      ref={boxRef}
      style={{
        height,
        minHeight: MIN_HEIGHT,
        resize: 'vertical',
        // The grip only appears when overflow is not visible. It also keeps the editor's
        // corners inside the rounded border.
        overflow: 'hidden',
        border: '1px solid #d9d9d9',
        borderRadius: 6,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <CodeMirror
        value={value}
        height="100%"
        extensions={extensions}
        editable={!disabled}
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: !disabled,
          highlightActiveLineGutter: !disabled,
          autocompletion: true,
        }}
        style={{ fontSize: 12, height: '100%' }}
      />
    </div>
  )
}
