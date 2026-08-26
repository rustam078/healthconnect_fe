import axiosClient from '../../api/axiosClient.js'

export function getSpecialties({ search, page = 0, size = 20 }) {
  return axiosClient.get('/specialties', {
    params: {
      search: search || undefined,
      page,
      size,
    },
  })
}

export function createSpecialty(payload) {
  return axiosClient.post('/specialties', payload)
}

export function updateSpecialty(id, payload) {
  return axiosClient.put(`/specialties/${id}`, payload)
}

export function deleteSpecialty(id) {
  return axiosClient.delete(`/specialties/${id}`)
}
