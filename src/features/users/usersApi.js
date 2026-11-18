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

// The logged-in user sets their own profile photo. Content-Type undefined so the browser adds the
// multipart boundary; returns the StoredFile (its id becomes the user's avatarFileId).
export function uploadMyAvatar(file) {
  const form = new FormData()
  form.append('file', file)
  return axiosClient.post('/users/me/avatar', form, { headers: { 'Content-Type': undefined } })
}
