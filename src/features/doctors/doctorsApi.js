import axiosClient from '../../api/axiosClient.js'

const FILTER_KEYS = [
  'gender',
  'qualification',
  'minExperience',
  'maxExperience',
  'minConsultationFee',
  'maxConsultationFee',
]

function buildFilterBody(filter = {}) {
  const body = {}
  FILTER_KEYS.forEach((k) => {
    const v = filter[k]
    if (v !== undefined && v !== null && v !== '') body[k] = v
  })
  return body
}

// Search is a POST endpoint: DoctorFilterDto in the body + search/page/size as query params.
export function getDoctors({ search, filter, page = 0, size = 20 }) {
  return axiosClient.post('/doctors/search', buildFilterBody(filter), {
    params: { search: search || undefined, page, size },
  })
}

export function createDoctor(payload) {
  return axiosClient.post('/doctors', payload)
}

export function updateDoctor(id, payload) {
  return axiosClient.put(`/doctors/${id}`, payload)
}

export function deleteDoctor(id) {
  return axiosClient.delete(`/doctors/${id}`)
}
