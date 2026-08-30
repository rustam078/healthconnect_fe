import { useEffect, useMemo, useState } from 'react'
import { Select } from 'antd'
import { useQuery, keepPreviousData } from '@tanstack/react-query'

// How long typing has to settle before the request goes out.
const SEARCH_DEBOUNCE_MS = 300

// How many rows one page of choices holds. Small on purpose: this is a dropdown, not a
// report - anything past the first twenty is found by typing, not by scrolling.
const PAGE_SIZE = 20

// A doctor or patient picker that searches THE DATABASE, not the rows it happens to hold.
//
// The old version loaded one page (100 patients, 200 doctors) and let antd filter inside
// it. With 5,000 patients that means most of them simply cannot be chosen: typing "Alka
// Patel" filtered 100 rows that never contained her. Here every keystroke (debounced) asks
// the server, so the whole table is reachable.
//
// `fetchPage`  ({ search, page, size }) -> Spring page of records
// `toOption`   record -> { value, label }
export default function PersonSelect({
  value,
  onChange,
  fetchPage,
  toOption,
  queryKey,
  placeholder,
  enabled = true,
}) {
  const [typed, setTyped] = useState('')
  const [term, setTerm] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setTerm(typed), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [typed])

  const { data, isFetching } = useQuery({
    queryKey: [queryKey, term || undefined],
    queryFn: () => fetchPage({ search: term || undefined, page: 0, size: PAGE_SIZE }),
    enabled,
    // The list does not change while someone is choosing from it.
    staleTime: 5 * 60_000,
    // Keeps the previous matches on screen while the next ones load, instead of blanking
    // the dropdown on every keystroke.
    placeholderData: keepPreviousData,
  })

  const options = useMemo(
    () => (data?.content ?? []).map(toOption),
    [data, toOption],
  )

  // The chosen person, kept in the list even when they are not in the current results.
  //
  // Without this, picking someone and then typing a different search empties the field on
  // screen - antd can only render a label for an option it can still see. Remembered here
  // so the selection survives whatever is typed next.
  const [selectedOption, setSelectedOption] = useState(null)
  useEffect(() => {
    if (value == null) {
      setSelectedOption(null)
      return
    }
    const found = options.find((o) => o.value === value)
    if (found) setSelectedOption(found)
  }, [value, options])

  const shownOptions = useMemo(() => {
    if (!selectedOption || options.some((o) => o.value === selectedOption.value)) {
      return options
    }
    return [selectedOption, ...options]
  }, [options, selectedOption])

  return (
    <Select
      showSearch
      allowClear
      placeholder={placeholder}
      value={value}
      loading={isFetching}
      onSearch={setTyped}
      onChange={onChange}
      // The server already decided what matches. Filtering its answer again against a
      // half-typed term would hide rows it deliberately returned.
      filterOption={false}
      notFoundContent={isFetching ? 'Searching…' : 'No matches'}
      options={shownOptions}
    />
  )
}
