import { useEffect, useState } from 'react'
import { Select, DatePicker, InputNumber, Input, Space, Button } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { getFilterOptions } from './widgetFiltersApi.js'
import { enumLabel } from '../../constants/enums.js'

// Draws the controls a widget asks for.
//
// A widget's `filters` is an ARRAY of the things a person needs to click, not a list of
// the query's parameters:
//   { "id": "doctorId", "type": "single-select", "label": "Doctor", "source": "db" }
//   { "id": "fromDate",  "type": "date",          "label": "From" }
//
// `source: "db"` means the choices come from the filter catalogue - a row in widget_filter
// that owns the query behind the dropdown. Everything else needs no source.
//
// Any :name in a widget's SQL can still be sent without appearing here at all. A filter is
// declared only when the screen has to draw something for it.
export function parseFilterConfig(filters) {
  if (!filters) return []
  try {
    const parsed = typeof filters === 'string' ? JSON.parse(filters) : filters
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // A widget with unreadable settings should still draw its data, just without controls.
    return []
  }
}

// Choices fetched from the catalogue by filter id. The query returns two columns and the
// first is the value, whatever they are called.
function CatalogueSelect({ rule, value, onChange }) {
  const [typedTerm, setTypedTerm] = useState('')
  const [term, setTerm] = useState('')

  // Debounced, and sent as :search - the catalogue's own queries decide whether to use it.
  // Searching in the database rather than in the browser is what lets a dropdown reach
  // past the 200-row page cap, which a 5,000-patient list needs.
  useEffect(() => {
    const timer = setTimeout(() => setTerm(typedTerm), 300)
    return () => clearTimeout(timer)
  }, [typedTerm])

  const { data, isFetching } = useQuery({
    queryKey: ['filter-options', rule.id, term || undefined],
    queryFn: () => getFilterOptions(rule.id, term ? { search: term } : {}),
    staleTime: 5 * 60_000, // a lookup does not change while someone reads a dashboard
  })

  const rows = data ?? []
  const columns = rows.length > 0 ? Object.keys(rows[0]) : []
  const options = rows.map((row) => ({
    value: row[columns[0]],
    label: String(enumLabel(row[columns[1]] ?? row[columns[0]])),
  }))

  return (
    <Select
      allowClear
      showSearch
      size="small"
      loading={isFetching}
      placeholder={rule.label || rule.id}
      style={{ minWidth: 160, width: '100%' }}
      value={value}
      onSearch={setTypedTerm}
      // The server already answered; filtering its rows again against a half-typed term
      // would hide matches it deliberately returned.
      filterOption={false}
      notFoundContent={isFetching ? 'Searching…' : 'No matches'}
      // The label travels with the value so a chip can read "Aarti Nair" rather than "157".
      onChange={(v, option) => onChange(v, option?.label)}
      options={options}
    />
  )
}

export default function WidgetFilters({
  rules,
  onApply,
  immediate = true,
  appliedValues,
  appliedLabels,
}) {
  // Seeded from what is already applied, because this component does not always outlive the
  // filter it set. The board's popover is unmounted while the board is in edit mode, and a
  // fresh one would otherwise come back blank over data that is still filtered - controls
  // saying "no filter" above a card whose numbers disagree.
  //
  // Dates arrive back as the 'YYYY-MM-DD' the query was given, so they are turned back into
  // the dayjs the picker expects.
  const [draft, setDraft] = useState(() => {
    const seeded = {}
    for (const rule of rules) {
      const value = appliedValues?.[rule.id]
      if (value === undefined || value === null || value === '') continue
      seeded[rule.id] = rule.type === 'date' ? dayjs(value) : value
    }
    return seeded
  })
  // What is in the search boxes right now, which is not the same as what is being filtered
  // on - text only becomes a filter when it is submitted.
  const [typed, setTyped] = useState(() => {
    const seeded = {}
    for (const rule of rules) {
      if (!rule.source && rule.type !== 'date' && rule.type !== 'number') {
        const value = appliedValues?.[rule.id]
        if (value !== undefined && value !== null) seeded[rule.id] = String(value)
      }
    }
    return seeded
  })
  // The text a chip should show for each chosen value, kept beside the values themselves.
  const [chosenLabels, setChosenLabels] = useState(() => ({ ...appliedLabels }))

  if (rules.length === 0) return null

  // Values go up as a flat bag, keyed by the filter id, because that is exactly how the
  // engine binds them: :doctorId, :fromDate. No operator, no wrapper - the widget's SQL
  // already says how each one is compared.
  const submit = (next, labels) => {
    const params = {}
    const display = {}
    for (const rule of rules) {
      const value = next[rule.id]
      if (value === undefined || value === null || value === '') continue
      const isDate = dayjs.isDayjs(value)
      params[rule.id] = isDate ? value.format('YYYY-MM-DD') : value
      display[rule.id] = labels[rule.id] ?? (isDate ? value.format('DD MMM YYYY') : String(value))
    }
    onApply(params, display)
  }

  const applyWith = (next, labels) => {
    setDraft(next)
    setChosenLabels(labels)
    // With buttons, nothing reaches the query until Apply. Without them, every control
    // submits itself the moment it settles.
    if (immediate) submit(next, labels)
  }

  const set = (id, value, label) =>
    applyWith({ ...draft, [id]: value }, { ...chosenLabels, [id]: label })

  const controlFor = (rule) => {
    const value = draft[rule.id]

    if (rule.source === 'db') {
      return <CatalogueSelect rule={rule} value={value} onChange={(v, label) => set(rule.id, v, label)} />
    }
    if (rule.type === 'date') {
      return (
        <DatePicker
          size="small"
          format="DD MMM YYYY"
          placeholder={rule.label || rule.id}
          value={value ?? null}
          onChange={(v) => set(rule.id, v)}
        />
      )
    }
    // A short fixed list can be written straight into the widget instead of the catalogue.
    if (Array.isArray(rule.options)) {
      return (
        <Select
          allowClear
          size="small"
          placeholder={rule.label || rule.id}
          style={{ minWidth: 140 }}
          value={value}
          onChange={(v, option) => set(rule.id, v, option?.label)}
          options={rule.options.map((o) => ({ ...o, label: enumLabel(o.label ?? o.value) }))}
        />
      )
    }
    if (rule.type === 'number') {
      return (
        <InputNumber
          size="small"
          placeholder={rule.label || rule.id}
          value={value}
          onChange={(v) => set(rule.id, v)}
        />
      )
    }
    // Typing updates `typed` and nothing else; only Enter or the icon promotes it to a
    // filter, so a five-letter name costs one request rather than five.
    return (
      <Input.Search
        size="small"
        allowClear
        enterButton={<SearchOutlined />}
        placeholder={rule.label || rule.id}
        style={{ width: 180 }}
        value={typed[rule.id] ?? ''}
        onChange={(e) => {
          const text = e.target.value
          setTyped((current) => ({ ...current, [rule.id]: text }))
          // Emptying the box is its own submit: the clear icon should put the unfiltered
          // rows back without also needing Enter.
          if (!text) set(rule.id, undefined)
        }}
        onSearch={(v) => set(rule.id, v)}
      />
    )
  }

  // Stacked, each labelled: inside a popover there is room for one control per row, and a
  // column of unlabelled boxes leaves you guessing which date is "from".
  return (
    <Space orientation="vertical" size={8} style={{ width: '100%' }}>
      {rules.map((rule) => (
        <div key={rule.id}>
          <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 2 }}>
            {rule.label || rule.id}
          </div>
          {controlFor(rule)}
        </div>
      ))}

      {/* A board-wide filter changes every card at once, so it waits for Apply rather than
          refetching the whole dashboard on each half-made choice. */}
      {!immediate && (
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4 }}>
          <Button
            size="small"
            type="link"
            danger
            onClick={() => {
              setDraft({})
              setTyped({})
              setChosenLabels({})
              onApply({}, {})
            }}
          >
            Reset
          </Button>
          <Button size="small" type="primary" onClick={() => submit(draft, chosenLabels)}>
            Apply
          </Button>
        </div>
      )}
    </Space>
  )
}
