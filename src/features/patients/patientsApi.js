import axiosClient from '../../api/axiosClient.js'

export function getPatients({ search, gender, bloodGroup, page = 0, size = 20 }) {
  return axiosClient.get('/patients', {
    params: {
      search: search || undefined,
      gender: gender || undefined,
      bloodGroup: bloodGroup || undefined,
      page,
      size,
    },
  })
}

export function createPatient(payload) {
  return axiosClient.post('/patients', payload)
}

export function updatePatient(id, payload) {
  return axiosClient.put(`/patients/${id}`, payload)
}

export function deletePatient(id) {
  return axiosClient.delete(`/patients/${id}`)
}
