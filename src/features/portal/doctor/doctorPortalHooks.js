import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  getMyAppointments,
  getSchedule,
  getWorkspace,
  getConsultation,
  saveConsultation,
  completeAppointment,
  getPatientHistory,
  getPatientReports,
  getDepartmentPatients,
  getPatientProfile,
  getLabTests,
  orderTests,
  getOrderedTests,
  getFullHistory,
  getHistoryDetail,
  getAvailableSlots,
  scheduleFollowUp,
  getDoctorSpecialties,
  referPatient,
} from './doctorPortalApi.js'

// The doctor's own free slots on a date, for scheduling a follow-up.
export function useAvailableSlots(date) {
  return useQuery({
    queryKey: ['doctor-portal', 'slots', date],
    queryFn: () => getAvailableSlots(date),
    enabled: Boolean(date),
  })
}

export function useScheduleFollowUp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ appointmentId, payload }) => scheduleFollowUp(appointmentId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor-portal', 'schedule'] })
      qc.invalidateQueries({ queryKey: ['doctor-portal', 'workspace'] })
    },
  })
}

// Specialties the doctor can refer to.
export function useDoctorSpecialties() {
  return useQuery({ queryKey: ['doctor-portal', 'specialties'], queryFn: getDoctorSpecialties })
}

export function useRefer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ appointmentId, payload }) => referPatient(appointmentId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctor-portal', 'workspace'] }),
  })
}

// A patient's whole visit history across all doctors.
export function useFullHistory(patientId) {
  return useQuery({
    queryKey: ['doctor-portal', 'full-history', patientId],
    queryFn: () => getFullHistory(patientId),
    enabled: Boolean(patientId),
  })
}

// One past visit's full record (consultation + tests + reports).
export function useHistoryDetail(appointmentId) {
  return useQuery({
    queryKey: ['doctor-portal', 'history-detail', appointmentId],
    queryFn: () => getHistoryDetail(appointmentId),
    enabled: Boolean(appointmentId),
  })
}

// The lab-test catalogue the doctor searches when ordering.
export function useLabTests() {
  return useQuery({ queryKey: ['doctor-portal', 'lab-tests'], queryFn: getLabTests })
}

// Tests ordered on an appointment (with their status).
export function useOrderedTests(appointmentId) {
  return useQuery({
    queryKey: ['doctor-portal', 'ordered-tests', appointmentId],
    queryFn: () => getOrderedTests(appointmentId),
    enabled: Boolean(appointmentId),
  })
}

export function useOrderTests() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ appointmentId, labTestIds }) => orderTests(appointmentId, labTestIds),
    onSuccess: (_d, { appointmentId }) =>
      qc.invalidateQueries({ queryKey: ['doctor-portal', 'ordered-tests', appointmentId] }),
  })
}

// The doctor's day as rich schedule rows (patient details included), earliest slot first.
export function useSchedule(date) {
  return useQuery({
    queryKey: ['doctor-portal', 'schedule', date],
    queryFn: () => getSchedule(date),
  })
}

// Header details for the consultation workspace page.
export function useWorkspace(appointmentId) {
  return useQuery({
    queryKey: ['doctor-portal', 'workspace', appointmentId],
    queryFn: () => getWorkspace(appointmentId),
    enabled: Boolean(appointmentId),
  })
}

// Mark one of the doctor's appointments as completed.
export function useCompleteAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: completeAppointment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor-portal', 'appointments'] })
      qc.invalidateQueries({ queryKey: ['doctor-portal', 'schedule'] })
    },
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
