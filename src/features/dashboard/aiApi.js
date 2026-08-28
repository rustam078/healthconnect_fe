import axiosClient from '../../api/axiosClient.js'

// The "Ask AI" endpoints. axiosClient already unwraps the ApiResponse envelope,
// so each call returns the plain data.

// Turn a plain-English question into SQL. The backend asks the AI, checks the answer is a
// safe SELECT, and saves it as a DRAFT widget.
//
// `title` is optional and becomes the heading on the widget (the `name` column). Leave it
// blank and the question is used instead.
//
// Returns { widgetId, code, question, name, status, sql } - the SQL is included ON PURPOSE
// so a person can read it before trusting it.
export function generateQuery({ question, title }) {
  return axiosClient.post('/ai/generate', { question, title })
}

// Flip a reviewed DRAFT to APPROVED.
export function approveWidget(id) {
  return axiosClient.put(`/widgets/${id}/approve`)
}

