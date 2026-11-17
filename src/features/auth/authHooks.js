import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { login, getMe } from './authApi.js'
import {
  loginSucceeded,
  permissionsLoaded,
  selectToken,
  selectPermissions,
} from '../../store/authSlice.js'

// Logs in and stores the token, user and permissions in redux.
export function useLogin() {
  const dispatch = useDispatch()
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => dispatch(loginSucceeded(data)),
  })
}

// On a hard reload with a stored token but no permissions yet, fetches the authoritative permissions.
export function useBootstrapAuth() {
  const dispatch = useDispatch()
  const token = useSelector(selectToken)
  const permissions = useSelector(selectPermissions)
  const needsBootstrap = Boolean(token) && permissions.length === 0

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMe,
    enabled: needsBootstrap,
    retry: false,
  })

  useEffect(() => {
    if (query.data) dispatch(permissionsLoaded(query.data))
  }, [query.data, dispatch])

  // Only hold the app behind the spinner on reload; after login permissions are already present.
  return { isLoading: needsBootstrap && query.isLoading }
}
