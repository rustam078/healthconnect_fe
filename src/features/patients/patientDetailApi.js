import axiosClient from '../../api/axiosClient.js'

// One patient plus their summary numbers. Also the only way to fetch a single patient -
// the list endpoint returns a page, not a record.
export function getPatientDetails(patientId) {
  return axiosClient.get(`/patients/${patientId}/details`)
}

// That patient's visit history, newest first. Paged on the server: a long-standing patient
// has more visits than anyone wants in one response.
export function getPatientAppointments(patientId, { page = 0, size = 10 } = {}) {
  return axiosClient.get(`/patients/${patientId}/appointments`, { params: { page, size } })
}
