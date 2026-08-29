import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSettings, createSetting, updateSetting, deleteSetting } from './settingsApi.js'

// Every setting. One shared query key, so a change made on the settings screen also
// reaches the features reading a setting through useSetting below.
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    staleTime: 5 * 60_000,
  })
}

// The ways a stored value says "no". Compared lower-case and trimmed.
const OFF_WORDS = new Set(['false', '0', 'no', 'off'])

// One named setting, read as a yes/no.
//
// A row has TWO things that can turn it off, and both are honoured here:
//   - the `enabled` flag, the switch in the settings table
//   - the value itself, when it spells out a no: false / 0 / no / off
//
// Reading only one of them is a trap. The list shows `ai.show-sql = true`, so setting the
// VALUE to false is the obvious way to turn it off - and a feature that ignored that would
// carry on as if nothing had been changed. A value that isn't a no (including a blank one)
// leaves the enabled flag to decide.
//
// `fallback` is what applies while the settings load or if the row was never created, so a
// missing setting never silently turns a feature off - it behaves as it did before anyone
// thought to make it configurable.
export function useSetting(name, fallback = true) {
  const { data } = useSettings()
  if (!data) return fallback
  const row = data.find((s) => s.name === name)
  if (!row) return fallback
  if (!row.enabled) return false
  return !OFF_WORDS.has(String(row.value ?? '').trim().toLowerCase())
}

export function useCreateSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createSetting,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}

export function useUpdateSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updateSetting(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}

export function useDeleteSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteSetting,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}
