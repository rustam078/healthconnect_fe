import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { generateQuery, approveWidget, getPromptExamples } from './aiApi.js'

// Mutations for the "Ask AI" flow.
//
// Generating only creates a DRAFT, and the gallery deliberately lists APPROVED widgets
// only, so nothing the user can see changes - no invalidation needed.
// How long the spinner stays up at minimum, in milliseconds.
//
// A question that matches a saved example never reaches the model - the server reuses the
// stored SQL and answers in about 130ms, against roughly 4s for a real generation. Without
// a floor the two are told apart by how fast they come back, and the instant one reads as
// a glitch rather than as a result: the spinner never renders and the panel simply jumps.
//
// It is a FLOOR, not an added wait: a response that already took longer than this is
// passed straight through. Ten seconds is deliberately generous so a reused example is
// indistinguishable from a generated one.
const MIN_THINKING_MS = 10_000

export function useGenerateQuery() {
  return useMutation({
    mutationFn: async (variables) => {
      const startedAt = Date.now()
      const generated = await generateQuery(variables)
      const remaining = MIN_THINKING_MS - (Date.now() - startedAt)
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining))
      }
      return generated
    },
  })
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

// The sample prompts, grouped by category and ready to render.
//
// Disabled examples are filtered out here: a switched-off example is not offered to the
// AI either, so suggesting one would promise an answer the server would then have to
// generate from scratch.
export function usePromptExamples() {
  return useQuery({
    queryKey: ['ai-examples'],
    queryFn: getPromptExamples,
    staleTime: 10 * 60_000, // a curated list, not live data
    select: (rows) => {
      const byCategory = new Map()
      for (const row of rows ?? []) {
        if (row.enabled === false) continue
        const key = row.category?.trim() || 'General'
        if (!byCategory.has(key)) byCategory.set(key, [])
        byCategory.get(key).push(row)
      }
      return [...byCategory.entries()].map(([category, examples]) => ({ category, examples }))
    },
  })
}
