import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  createAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
  searchAppointments,
  getAppointmentDetail,
} from './appointmentsApi.js'

// Admin appointment search (latest created first). page is 1-based in the UI, 0-based on the API.
export function useAppointmentSearch(filters, page, size = 20) {
  return useQuery({
    queryKey: ['appointments', 'search', filters, page, size],
    queryFn: () => searchAppointments({ ...filters, page: page - 1, size }),
    placeholderData: keepPreviousData,
  })
}

// One appointment's ordered tests + reports (and consultation) for the detail drawer.
export function useAppointmentDetail(appointmentId, enabled) {
  return useQuery({
    queryKey: ['appointments', 'detail', appointmentId],
    queryFn: () => getAppointmentDetail(appointmentId),
    enabled: Boolean(appointmentId) && enabled,
  })
}

export function useCreateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAppointment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

// All three of these change what a doctor's day looks like, so each invalidates the
// appointment queries the board is built from.
export function useUpdateAppointmentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => updateAppointmentStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useRescheduleAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }) => rescheduleAppointment(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useCancelAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}
