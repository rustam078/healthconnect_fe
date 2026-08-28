import axiosClient from '../../api/axiosClient.js'

// List widgets of one module. The gallery asks for WIDGET (hand-built) and PROMPT
// (AI-generated) separately and merges them.
// Returns a Spring "page" object; the hook reads its .content array.
export function getWidgets(module = 'WIDGET') {
  return axiosClient.get('/widgets', { params: { module, page: 0, size: 100 } })
}

// Run a widget and get its data rows. body is optional (filters/sort/paging).
export function getWidgetData(idOrCode, body = {}) {
  return axiosClient.post(`/widgets/${idOrCode}/data`, body)
}

// Remove a widget from the library entirely (a soft delete on the backend).
// Used both to discard an unwanted AI draft and to tidy an approved AI widget away.
export function deleteWidget(id) {
  return axiosClient.delete(`/widgets/${id}`)
}
