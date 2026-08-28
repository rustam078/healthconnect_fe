import { useMutation, useQueryClient } from '@tanstack/react-query'
import { generateQuery, approveWidget } from './aiApi.js'

// Mutations for the "Ask AI" flow.
//
// Generating only creates a DRAFT, and the gallery deliberately lists APPROVED widgets
// only, so nothing the user can see changes - no invalidation needed.
export function useGenerateQuery() {
  return useMutation({ mutationFn: generateQuery })
}

// Approving is what makes an AI widget appear in the gallery's Library tab, so the widget
// lists MUST be invalidated here. Without this the new widget only showed up after a
// page refresh.
export function useApproveWidget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: approveWidget,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['widgets'] }),
  })
}

// Discarding a draft is the same operation as deleting a widget from the library, so it
// lives in boardsHooks as useDeleteWidget - there is no separate hook for it.
