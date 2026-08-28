import axiosClient from '../../api/axiosClient.js'

// Boards = dashboard pages. axiosClient already unwraps the ApiResponse envelope,
// so each call returns the plain data.

export function getBoards() {
  return axiosClient.get('/boards')
}

export function createBoard(payload) {
  // payload: { name }
  return axiosClient.post('/boards', payload)
}

export function getBoard(id) {
  return axiosClient.get(`/boards/${id}`)
}

export function saveBoard(id, payload) {
  // payload: { name?, items: [{ widgetId, width }] }
  return axiosClient.put(`/boards/${id}`, payload)
}

export function deleteBoard(id) {
  return axiosClient.delete(`/boards/${id}`)
}
