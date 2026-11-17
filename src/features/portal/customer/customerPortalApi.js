import axiosClient from '../../../api/axiosClient.js'

export function getSpecialties() {
  return axiosClient.get('/customer-portal/specialties')
}

export function getAvailableDoctors({ specialtyId, date }) {
  return axiosClient.get('/customer-portal/available-doctors', {
    params: { specialtyId, date },
  })
}

export function bookAppointment(payload) {
  return axiosClient.post('/customer-portal/appointments', payload)
}

export function getMyAppointments({ page = 0, size = 20 }) {
  return axiosClient.get('/customer-portal/appointments', { params: { page, size } })
}

export function cancelAppointment(id) {
  return axiosClient.delete(`/customer-portal/appointments/${id}`)
}

export function getConsultation(appointmentId) {
  return axiosClient.get(`/customer-portal/appointments/${appointmentId}/consultation`)
}

export function getMyReports() {
  return axiosClient.get('/customer-portal/reports')
}
