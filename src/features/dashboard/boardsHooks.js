import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBoards, createBoard, getBoard, saveBoard, deleteBoard } from './boardsApi.js'
import { getWidgets, getWidgetData, deleteWidget } from './widgetsApi.js'

// ---- boards ----

export function useBoards() {
  return useQuery({ queryKey: ['boards'], queryFn: getBoards })
}

export function useBoard(id) {
  return useQuery({
    queryKey: ['board', id],
    queryFn: () => getBoard(id),
    enabled: !!id, // only fetch once a board is selected
  })
}

export function useCreateBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createBoard,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boards'] }),
  })
}

export function useSaveBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => saveBoard(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['board', vars.id] })
      qc.invalidateQueries({ queryKey: ['boards'] })
    },
  })
}

export function useDeleteBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteBoard,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boards'] }),
  })
}

// ---- widgets (for the gallery + rendering) ----

// Everything the gallery can offer: hand-built widgets plus APPROVED AI ones.
// Two calls rather than one, because the backend filters by a single module. React Query
// caches both, so reopening the gallery costs nothing.
export function useGalleryWidgets() {
  const built = useQuery({
    queryKey: ['widgets', 'WIDGET'],
    queryFn: () => getWidgets('WIDGET'),
    select: (page) => page?.content ?? [], // unwrap the Spring page
  })
  const ai = useQuery({
    queryKey: ['widgets', 'PROMPT'],
    queryFn: () => getWidgets('PROMPT'),
    // Drafts are half-finished by definition - only approved AI widgets belong in a picker.
    select: (page) => (page?.content ?? []).filter((w) => w.status === 'APPROVED'),
  })

  // useMemo, not a bare array literal: a fresh array every render would retrigger any
  // effect or memo downstream that depends on this list.
  const data = useMemo(() => [...(built.data ?? []), ...(ai.data ?? [])], [built.data, ai.data])

  return {
    data,
    isLoading: built.isLoading || ai.isLoading,
    error: built.error || ai.error,
  }
}

// Remove a widget from the library. Invalidates BOTH gallery lists so the card disappears
// without a reload.
export function useDeleteWidget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteWidget,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['widgets'] }),
  })
}

export function useWidgetData(idOrCode, pageSize = 50) {
  return useQuery({
    queryKey: ['widget-data', idOrCode, pageSize],
    queryFn: () => getWidgetData(idOrCode, { pageSize }),
    enabled: !!idOrCode,
    // The grid remounts when the layout changes (see BoardGrid). Without a staleTime that
    // would refetch every widget on the board each time one card is resized.
    staleTime: 60_000,
    // One retry, not none and not the default three.
    //
    // A widget whose SQL is wrong fails the same way every time, so retrying it three
    // times only delays the error. But NOT retrying at all means a single transient
    // failure - the backend restarting, a dropped connection, a timeout when a dozen
    // widgets query at once - leaves that card broken until the page is reloaded by hand.
    // One retry recovers from the transient case and still surfaces a real SQL error fast.
    retry: 1,
    retryDelay: 800,
  })
}
