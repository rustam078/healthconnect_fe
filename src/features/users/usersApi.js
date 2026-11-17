import axiosClient from '../../api/axiosClient.js'

export function getUsers() {
  return axiosClient.get('/users')
}

export function createUser(payload) {
  return axiosClient.post('/users', payload)
}

export function updateUser(id, payload) {
  return axiosClient.put(`/users/${id}`, payload)
}

export function deleteUser(id) {
  return axiosClient.delete(`/users/${id}`)
}
