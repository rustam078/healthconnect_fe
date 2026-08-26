import axios from 'axios'

const axiosClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Auth stub: JWT header will be attached here once Spring Security lands.
axiosClient.interceptors.request.use((config) => {
  // const token = getToken()
  // if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Unwrap the backend ApiResponse envelope on success.
axiosClient.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && typeof body === 'object' && typeof body.success === 'boolean') {
      return body.data ?? null
    }
    return body
  },
  (error) => {
    const body = error.response?.data
    const message =
      body?.message ||
      (Array.isArray(body?.errors) ? body.errors.join(', ') : null) ||
      error.message ||
      'Request failed'
    const wrapped = new Error(message)
    wrapped.status = error.response?.status
    wrapped.fieldErrors = body?.fieldErrors
    wrapped.errors = body?.errors ?? (body?.fieldErrors ? Object.values(body.fieldErrors) : undefined)
    return Promise.reject(wrapped)
  },
)

export default axiosClient
