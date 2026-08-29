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

// Run a query that has NOT been saved yet.
//
// This is what lets the "New widget" tab prove a query works before anything is written:
// a widget rejected at preview time never existed, so there is no soft-deleted row left
// holding its code in the unique index.
export function dryRunWidget({ sqlTemplate, pageSize = 20 }) {
  return axiosClient.post('/widgets/dry-run', { sqlTemplate, pageSize })
}

// Save a hand-written widget. The backend creates it APPROVED, so it appears in the
// gallery immediately - unlike an AI draft, a person already reviewed this one by
// looking at its preview.
export function createWidget({ code, name, description, type, module = 'WIDGET', filters, sqlTemplate }) {
  return axiosClient.post('/widgets', {
    code,
    name,
    description,
    type,
    module,
    // Sent only when there are any: a widget with no filters should store a null rather
    // than an empty config, so the parser's "no settings" path is the one that runs.
    ...(filters ? { filters } : {}),
    sqlTemplate,
  })
}

// One widget in full, including its SQL and filter settings - what the edit form fills
// itself from. The list endpoints deliberately return a lighter summary.
export function getWidget(idOrCode) {
  return axiosClient.get(`/widgets/${idOrCode}`)
}

// Save changes to an existing widget. `code` is deliberately absent: the backend keeps it
// fixed for the life of the widget, because boards and lookups refer to widgets by code.
export function updateWidget(id, { name, description, type, module = 'WIDGET', filters, sqlTemplate }) {
  return axiosClient.put(`/widgets/${id}`, {
    name,
    description,
    type,
    module,
    ...(filters ? { filters } : {}),
    sqlTemplate,
  })
}
