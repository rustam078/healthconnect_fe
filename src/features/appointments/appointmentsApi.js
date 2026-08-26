import axiosClient from '../../api/axiosClient.js'

export function createAppointment(payload) {
  return axiosClient.post('/appointments', payload)
}

// GET /appointments/{doctorId}?appointmentDate=YYYY-MM-DD → Page<AppointmentResponse>
export function getAppointmentsByDoctor(doctorId, appointmentDate) {
  return axiosClient.get(`/appointments/${doctorId}`, {
    params: { appointmentDate, page: 0, size: 100 },
  })
}
