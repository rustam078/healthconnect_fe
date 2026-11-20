import axiosClient from '../../../api/axiosClient.js'

// Shared specialties endpoint (any logged-in role may read it); returns the page's content array.
export function getSpecialties() {
  return axiosClient.get('/specialties', { params: { size: 1000 } }).then((page) => page?.content ?? [])
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
