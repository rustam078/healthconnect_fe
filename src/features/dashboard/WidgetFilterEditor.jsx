import { Button, Input, Select, Typography, theme } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { getFilterCatalogue } from './widgetFiltersApi.js'

const { Text } = Typography

// What a control can be when it is not a catalogue dropdown. A catalogue entry is always a
// dropdown - that is the whole reason it exists.
const OWN_TYPES = ['date', 'text', 'number']

const blankRule = () => ({ id: '', label: '', type: 'text', source: '' })

// Declares the CONTROLS a widget wants - not its parameters.
//
// Any :name in the SQL can be sent without appearing here; a row is added only when a
// person needs something to click. Two kinds of row:
//
//   from the catalogue  a shared filter (Doctor, Patient, Status) that already knows how
//                       to fetch its own choices - picked by id, nothing else to fill in
//   its own             a date, a number or a search box that belongs to this widget alone
export default function WidgetFilterEditor({ rules, onChange }) {
  const { token } = theme.useToken()

  const { data: catalogue = [], isLoading } = useQuery({
    queryKey: ['filter-catalogue'],
    queryFn: getFilterCatalogue,
    staleTime: 5 * 60_000,
  })

  const update = (index, patch) =>
    onChange(rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)))

  const remove = (index) => onChange(rules.filter((_, i) => i !== index))

  const pickFromCatalogue = (index, id) => {
    const entry = catalogue.find((c) => c.id === id)
    update(index, {
      id,
      label: entry?.name ?? id,
      type: 'single-select',
      source: 'db',
    })
  }

  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Each row adds one control to the card. Its id must match a <code>:name</code> in the
        SQL below — <code>doctorId</code> fills <code>:doctorId</code>.
      </Text>

      {rules.map((rule, index) => {
        const fromCatalogue = rule.source === 'db'
        return (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: 6,
              marginTop: 8,
              padding: 8,
              borderRadius: token.borderRadius,
              background: token.colorFillQuaternary,
            }}
          >
            <Select
              size="small"
              value={fromCatalogue ? 'db' : 'own'}
              onChange={(v) =>
                v === 'db'
                  ? update(index, { source: 'db', type: 'single-select' })
                  : update(index, { source: '', type: 'text' })
              }
              options={[
                { label: 'catalogue', value: 'db' },
                { label: 'its own', value: 'own' },
              ]}
              style={{ width: 110 }}
            />

            {fromCatalogue ? (
              <Select
                size="small"
                showSearch
                optionFilterProp="label"
                loading={isLoading}
                placeholder="which filter"
                value={rule.id || undefined}
                onChange={(v) => pickFromCatalogue(index, v)}
                options={catalogue.map((c) => ({ label: `${c.name} (${c.id})`, value: c.id }))}
                style={{ width: 210 }}
              />
            ) : (
              <>
                <Input
                  size="small"
                  placeholder="id, e.g. fromDate"
                  value={rule.id}
                  onChange={(e) => update(index, { id: e.target.value })}
                  style={{ width: 130 }}
                />
                <Select
                  size="small"
                  value={rule.type}
                  onChange={(v) => update(index, { type: v })}
                  options={OWN_TYPES.map((t) => ({ label: t, value: t }))}
                  style={{ width: 90 }}
                />
              </>
            )}

            <Input
              size="small"
              placeholder="label"
              value={rule.label}
              onChange={(e) => update(index, { label: e.target.value })}
              style={{ flex: 1, minWidth: 90 }}
            />
            <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => remove(index)} />
          </div>
        )
      })}

      <Button
        size="small"
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => onChange([...rules, blankRule()])}
        style={{ marginTop: 8 }}
        block
      >
        Add control
      </Button>
    </div>
  )
}

// Rows -> the array the backend stores. Undefined when nothing is filled in, so a widget
// with no controls keeps a null rather than an empty shell.
export function toFilterConfig(rules) {
  const usable = rules.filter((rule) => rule.id.trim() !== '')
  if (usable.length === 0) return undefined
  return usable.map((rule) => ({
    id: rule.id.trim(),
    type: rule.type,
    label: rule.label.trim() || rule.id.trim(),
    ...(rule.source === 'db' ? { source: 'db' } : {}),
  }))
}

// The stored array -> editor rows. The inverse of toFilterConfig, and it has to be: a round
// trip through the form must not quietly drop something it could not draw.
export function fromFilterConfig(filters) {
  if (!filters) return []
  const parsed = typeof filters === 'string' ? JSON.parse(filters) : filters
  if (!Array.isArray(parsed)) return []
  return parsed.map((rule) => ({
    id: rule.id ?? '',
    label: rule.label ?? '',
    type: rule.type ?? 'text',
    source: rule.source ?? '',
  }))
}
