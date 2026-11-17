import axiosClient from '../../api/axiosClient.js'

// Multipart upload: formData carries patientId, title and the PDF file.
export function uploadReport(formData) {
  return axiosClient.post('/reports', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function getReports(patientId) {
  return axiosClient.get('/reports', { params: { patientId } })
}

export function getOrderedTests(appointmentId) {
  return axiosClient.get(`/reports/appointments/${appointmentId}/tests`)
}
