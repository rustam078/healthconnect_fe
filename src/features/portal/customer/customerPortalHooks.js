import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSpecialties,
  getAvailableDoctors,
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  getConsultation,
  getMyReports,
} from './customerPortalApi.js'

export function useSpecialties() {
  return useQuery({
    queryKey: ['portal', 'specialties'],
    queryFn: getSpecialties,
    select: (data) => data ?? [],
  })
}

// Only runs once a specialty and date are both chosen.
export function useAvailableDoctors({ specialtyId, date }) {
  return useQuery({
    queryKey: ['portal', 'available-doctors', specialtyId, date],
    queryFn: () => getAvailableDoctors({ specialtyId, date }),
    enabled: Boolean(specialtyId && date),
  })
}

export function useBookAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: bookAppointment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal', 'available-doctors'] })
      qc.invalidateQueries({ queryKey: ['portal', 'appointments'] })
    },
  })
}

export function useMyAppointments({ page = 1, size = 20 }) {
  return useQuery({
    queryKey: ['portal', 'appointments', page, size],
    queryFn: () => getMyAppointments({ page: page - 1, size }),
  })
}

export function useCancelAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal', 'appointments'] }),
  })
}

// 404 means the visit has no consultation yet; retry would be pointless.
export function useConsultation(appointmentId, enabled) {
  return useQuery({
    queryKey: ['portal', 'consultation', appointmentId],
    queryFn: () => getConsultation(appointmentId),
    enabled: Boolean(appointmentId && enabled),
    retry: false,
  })
}

export function useMyReports() {
  return useQuery({
    queryKey: ['portal', 'reports'],
    queryFn: getMyReports,
  })
}
