import axiosClient from '../../api/axiosClient.js'

// POST /appointments/{id}/consultation → records the visit (complaint, diagnosis, notes,
// medicines) and moves the appointment to COMPLETED in one call.
export function createConsultation(appointmentId, payload) {
  return axiosClient.post(`/appointments/${appointmentId}/consultation`, payload)
}

// GET /appointments/{id}/consultation → the recorded visit, medicines included.
export function getConsultation(appointmentId) {
  return axiosClient.get(`/appointments/${appointmentId}/consultation`)
}
