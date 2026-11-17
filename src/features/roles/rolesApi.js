import axiosClient from '../../api/axiosClient.js'

export function getModules() {
  return axiosClient.get('/modules')
}

export function getRoles() {
  return axiosClient.get('/roles')
}

export function getRole(id) {
  return axiosClient.get(`/roles/${id}`)
}

export function createRole(payload) {
  return axiosClient.post('/roles', payload)
}

export function updateRole(id, payload) {
  return axiosClient.put(`/roles/${id}`, payload)
}

export function deleteRole(id) {
  return axiosClient.delete(`/roles/${id}`)
}
