import axiosClient from '../../api/axiosClient.js'

export function login({ username, password }) {
  return axiosClient.post('/auth/login', { username, password })
}

export function getMe() {
  return axiosClient.get('/auth/me')
}
