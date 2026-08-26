import { useMutation } from '@tanstack/react-query'
import { createAppointment } from './appointmentsApi.js'

// No cache to invalidate yet — the appointment listing API is still pending.
export function useCreateAppointment() {
  return useMutation({ mutationFn: createAppointment })
}
