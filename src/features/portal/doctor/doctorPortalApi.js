import axiosClient from '../../../api/axiosClient.js'

export function getMyAppointments({ date, page = 0, size = 20 }) {
  return axiosClient.get('/doctor-portal/appointments', {
    params: { date: date || undefined, page, size },
  })
}

export function getSchedule(date) {
  return axiosClient.get('/doctor-portal/schedule', { params: { date: date || undefined } })
}

export function getWorkspace(appointmentId) {
  return axiosClient.get(`/doctor-portal/appointments/${appointmentId}/workspace`)
}

export function getLabTests() {
  return axiosClient.get('/doctor-portal/lab-tests')
}

export function orderTests(appointmentId, labTestIds) {
  return axiosClient.post(`/doctor-portal/appointments/${appointmentId}/tests`, { labTestIds })
}

// Shared v1 endpoint (resource-guard scopes it to the visit's doctor/patient or admin).
export function getOrderedTests(appointmentId) {
  return axiosClient.get(`/reports/appointments/${appointmentId}/tests`)
}

export function getAvailableSlots(date) {
  return axiosClient.get('/doctor-portal/available-slots', { params: { date } })
}

export function scheduleFollowUp(appointmentId, payload) {
  return axiosClient.post(`/doctor-portal/appointments/${appointmentId}/follow-up`, payload)
}

// Shared specialties endpoint (any logged-in role may read it); returns the page's content array.
export function getDoctorSpecialties() {
  return axiosClient.get('/specialties', { params: { size: 1000 } }).then((page) => page?.content ?? [])
}

export function referPatient(appointmentId, payload) {
  return axiosClient.post(`/doctor-portal/appointments/${appointmentId}/referral`, payload)
}

export function getFullHistory(patientId) {
  return axiosClient.get(`/doctor-portal/patients/${patientId}/full-history`)
}

// Shared v1 detail endpoint (same HistoryDetailResponse); resource-guard scopes access.
export function getHistoryDetail(appointmentId) {
  return axiosClient.get(`/appointments/${appointmentId}/detail`)
}

// Shared appointment endpoints (ownership enforced server-side by the resource guard):
// a doctor reads/writes only their own visit; the consultation POST also marks it COMPLETED.
export function getConsultation(appointmentId) {
  return axiosClient.get(`/appointments/${appointmentId}/consultation`)
}

export function saveConsultation(appointmentId, payload) {
  return axiosClient.post(`/appointments/${appointmentId}/consultation`, payload)
}

export function completeAppointment(appointmentId) {
  return axiosClient.patch(`/appointments/${appointmentId}/status`, null, { params: { status: 'COMPLETED' } })
}

export function getPatientHistory(patientId) {
  return axiosClient.get(`/doctor-portal/patients/${patientId}/history`)
}

export function getPatientReports(patientId) {
  return axiosClient.get(`/doctor-portal/patients/${patientId}/reports`)
}

export function getDepartmentPatients() {
  return axiosClient.get('/doctor-portal/patients')
}

// Shared v1 patient details (same PatientDetailResponse); resource-guard scopes access.
export function getPatientProfile(patientId) {
  return axiosClient.get(`/patients/${patientId}/details`)
}
