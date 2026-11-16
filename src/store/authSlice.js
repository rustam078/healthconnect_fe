import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  token: localStorage.getItem('token') || null,
  user: null,
  permissions: [],
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSucceeded(state, { payload }) {
      state.token = payload.token
      state.user = payload.user
      state.permissions = payload.permissions || []
      localStorage.setItem('token', payload.token)
    },
    permissionsLoaded(state, { payload }) {
      state.user = payload.user
      state.permissions = payload.permissions || []
    },
    loggedOut(state) {
      state.token = null
      state.user = null
      state.permissions = []
      localStorage.removeItem('token')
    },
  },
})

export const { loginSucceeded, permissionsLoaded, loggedOut } = authSlice.actions

export const selectToken = (state) => state.auth.token
export const selectUser = (state) => state.auth.user
export const selectPermissions = (state) => state.auth.permissions
export const selectIsAuthenticated = (state) => Boolean(state.auth.token)

export default authSlice.reducer
