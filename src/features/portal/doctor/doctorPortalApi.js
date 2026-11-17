import axiosClient from '../../../api/axiosClient.js'

export function getMyAppointments({ date, page = 0, size = 20 }) {
  return axiosClient.get('/doctor-portal/appointments', {
    params: { date: date || undefined, page, size },
  })
}

export function getConsultation(appointmentId) {
  return axiosClient.get(`/doctor-portal/appointments/${appointmentId}/consultation`)
}

export function saveConsultation(appointmentId, payload) {
  return axiosClient.post(`/doctor-portal/appointments/${appointmentId}/consultation`, payload)
}

export function completeAppointment(appointmentId) {
  return axiosClient.put(`/doctor-portal/appointments/${appointmentId}/complete`)
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

export function getPatientProfile(patientId) {
  return axiosClient.get(`/doctor-portal/patients/${patientId}`)
}
