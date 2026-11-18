import axiosClient from '../../api/axiosClient.js'

export const listMyCommunities = () => axiosClient.get('/communities')
export const discoverCommunities = () => axiosClient.get('/communities/discover')
export const createCommunity = (payload) => axiosClient.post('/communities', payload)
export const deleteCommunity = (id) => axiosClient.delete(`/communities/${id}`)
export const getMembers = (id) => axiosClient.get(`/communities/${id}/members`)
export const addMembers = (id, userIds) => axiosClient.post(`/communities/${id}/members`, userIds)
export const removeMember = (id, memberId) => axiosClient.delete(`/communities/${id}/members/${memberId}`)
export const joinCommunity = (id) => axiosClient.post(`/communities/${id}/join`)
export const markRead = (id, messageId) =>
  axiosClient.post(`/communities/${id}/read`, null, { params: { messageId } })

export const getHistory = (id, { beforeId, limit = 30 } = {}) =>
  axiosClient.get(`/communities/${id}/messages`, { params: { beforeId, limit } })

export const sendMessage = (id, payload) => axiosClient.post(`/communities/${id}/messages`, payload)
export const deleteMessage = (id, messageId) => axiosClient.delete(`/communities/${id}/messages/${messageId}`)

// Upload a chat image/file, scoped to this community so only its members can view it.
// Content-Type is set to undefined so the browser adds the correct multipart boundary itself —
// hardcoding 'multipart/form-data' omits the boundary and corrupts the uploaded bytes.
export const uploadChatFile = (communityId, file) => {
  const form = new FormData()
  form.append('file', file)
  form.append('category', 'COMMUNITY_CHAT')
  form.append('referenceId', communityId)
  return axiosClient.post('/files', form, { headers: { 'Content-Type': undefined } })
}
