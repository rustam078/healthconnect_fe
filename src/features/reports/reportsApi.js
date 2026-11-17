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

export function getLabOrders({ appointmentId, page = 0, size = 10 }) {
  return axiosClient.get('/reports/lab-orders', {
    params: { appointmentId: appointmentId ?? undefined, page, size },
  })
}

export function uploadReportForTest(orderedTestId, formData) {
  return axiosClient.post(`/reports/ordered-tests/${orderedTestId}/report`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function removeReportFromTest(orderedTestId) {
  return axiosClient.delete(`/reports/ordered-tests/${orderedTestId}/report`)
}

export function deleteOrderedTest(orderedTestId) {
  return axiosClient.delete(`/reports/ordered-tests/${orderedTestId}`)
}
