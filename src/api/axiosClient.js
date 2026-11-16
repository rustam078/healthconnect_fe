import axios from 'axios'
import { store } from '../store/store.js'
import { loggedOut } from '../store/authSlice.js'

const axiosClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach the stored JWT on every request.
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
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
    // Session expired or missing: clear auth state and route to login.
    if (error.response?.status === 401) {
      store.dispatch(loggedOut())
      if (window.location.pathname !== '/login') window.location.assign('/login')
    }
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
