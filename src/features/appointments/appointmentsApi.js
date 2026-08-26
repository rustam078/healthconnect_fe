import axiosClient from '../../api/axiosClient.js'

export function createAppointment(payload) {
  return axiosClient.post('/appointments', payload)
}
