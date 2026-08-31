import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createConsultation, getConsultation } from './consultationApi.js'

// The recorded visit for a completed appointment. A 404 means "nothing recorded yet" - a
// legitimate state, not a failure - so it resolves to null instead of throwing and retrying.
export function useConsultation(appointmentId, enabled) {
  return useQuery({
    queryKey: ['consultation', appointmentId],
    queryFn: async () => {
      try {
        return await getConsultation(appointmentId)
      } catch (e) {
        if (e.status === 404) return null
        throw e
      }
    },
    enabled: !!enabled && appointmentId != null,
  })
}

export function useCreateConsultation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ appointmentId, ...payload }) => createConsultation(appointmentId, payload),
    // The consultation now exists (the appointment's own status is untouched here), so
    // refresh this appointment's consultation view.
    onSuccess: (_data, { appointmentId }) => {
      qc.invalidateQueries({ queryKey: ['consultation', appointmentId] })
    },
  })
}
