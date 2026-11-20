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

// GET /appointments → admin's paginated, filtered list of every doctor's appointments.
// The server sorts latest-created first; undefined filters are dropped by axios.
export function searchAppointments({ doctorId, appointmentId, patientId, patientName, status, dateFrom, dateTo, page = 0, size = 20 }) {
  return axiosClient.get('/appointments', {
    params: { doctorId, appointmentId, patientId, patientName, status, dateFrom, dateTo, page, size },
  })
}

// GET /appointments/{id}/detail → HistoryDetailResponse (consultation, ordered tests, reports).
export function getAppointmentDetail(id) {
  return axiosClient.get(`/appointments/${id}/detail`)
}

// Move an appointment to another status. Which moves are legal is decided by the backend's
// state machine, so an illegal one comes back as a 400 with the reason, not a silent no-op.
export function updateAppointmentStatus(id, status) {
  return axiosClient.patch(`/appointments/${id}/status`, null, { params: { status } })
}

// Move an existing appointment to a different doctor and/or time. The backend locks the
// doctor while it re-checks the slot, so a clash loses rather than double-booking.
export function rescheduleAppointment(id, { doctorId, appointmentDate, startTime, durationMinutes, appointmentType }) {
  return axiosClient.put(`/appointments/${id}`, {
    doctorId,
    appointmentDate,
    startTime,
    durationMinutes,
    appointmentType,
  })
}

// Call it off: the backend sets the status to CANCELLED and soft-deletes the row, which
// hands the slot back to whoever wants it next.
export function cancelAppointment(id) {
  return axiosClient.delete(`/appointments/${id}`)
}
