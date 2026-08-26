import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAppointment } from './appointmentsApi.js'

export function useCreateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAppointment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}
