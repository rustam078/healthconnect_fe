import axiosClient from '../../api/axiosClient.js'

// Application settings: one row per configurable value, e.g. `nim.api-key` or
// `ai.show-sql`. Anything that would otherwise live in application.properties and need a
// redeploy to change.
//
// The list is not paged - there are a handful of these, and the screen filters them in the
// browser.
export function getSettings() {
  return axiosClient.get('/settings')
}

export function createSetting(payload) {
  return axiosClient.post('/settings', payload)
}

// `value` may be left out, and then the stored one is kept.
//
// That is what makes a secret setting editable at all: the server masks secrets on the way
// out, so this screen only ever holds `nvap****m_eY`. Sending that back would write the
// mask over the real key. See SettingService.update.
export function updateSetting(id, payload) {
  return axiosClient.put(`/settings/${id}`, payload)
}

export function deleteSetting(id) {
  return axiosClient.delete(`/settings/${id}`)
}
