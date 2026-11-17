import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  getMyAppointments,
  getConsultation,
  saveConsultation,
  completeAppointment,
  getPatientHistory,
  getPatientReports,
  getDepartmentPatients,
  getPatientProfile,
} from './doctorPortalApi.js'

// Mark one of the doctor's appointments as completed.
export function useCompleteAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: completeAppointment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctor-portal', 'appointments'] }),
  })
}

// Every patient in the logged-in doctor's department.
export function useDepartmentPatients() {
  return useQuery({
    queryKey: ['doctor-portal', 'patients'],
    queryFn: getDepartmentPatients,
  })
}

// One department patient's profile + visit stats.
export function usePatientProfile(patientId) {
  return useQuery({
    queryKey: ['doctor-portal', 'patient', patientId],
    queryFn: () => getPatientProfile(patientId),
    enabled: Boolean(patientId),
  })
}

export function useMyAppointments({ date, page = 1, size = 20 }) {
  return useQuery({
    queryKey: ['doctor-portal', 'appointments', { date, page, size }],
    queryFn: () => getMyAppointments({ date, page: page - 1, size }),
    placeholderData: keepPreviousData,
  })
}

// Loads an existing consultation to pre-fill the form; a 404 means none written yet.
export function useConsultation(appointmentId, enabled) {
  return useQuery({
    queryKey: ['doctor-portal', 'consultation', appointmentId],
    queryFn: () => getConsultation(appointmentId),
    enabled: Boolean(appointmentId) && enabled,
    retry: false,
  })
}

export function useSaveConsultation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ appointmentId, payload }) => saveConsultation(appointmentId, payload),
    onSuccess: (_data, { appointmentId }) => {
      qc.invalidateQueries({ queryKey: ['doctor-portal', 'consultation', appointmentId] })
      qc.invalidateQueries({ queryKey: ['doctor-portal', 'appointments'] })
    },
  })
}

export function usePatientHistory(patientId) {
  return useQuery({
    queryKey: ['doctor-portal', 'history', patientId],
    queryFn: () => getPatientHistory(patientId),
    enabled: Boolean(patientId),
  })
}

export function usePatientReports(patientId) {
  return useQuery({
    queryKey: ['doctor-portal', 'reports', patientId],
    queryFn: () => getPatientReports(patientId),
    enabled: Boolean(patientId),
  })
}
