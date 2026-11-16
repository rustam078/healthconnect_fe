import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { login, getMe } from './authApi.js'
import {
  loginSucceeded,
  permissionsLoaded,
  selectToken,
} from '../../store/authSlice.js'

// Logs in and stores the token, user and permissions in redux.
export function useLogin() {
  const dispatch = useDispatch()
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => dispatch(loginSucceeded(data)),
  })
}

// On app load, fetches the authoritative permissions when a token exists.
export function useBootstrapAuth() {
  const dispatch = useDispatch()
  const token = useSelector(selectToken)

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMe,
    enabled: Boolean(token),
    retry: false,
  })

  useEffect(() => {
    if (query.data) dispatch(permissionsLoaded(query.data))
  }, [query.data, dispatch])

  return { isLoading: Boolean(token) && query.isLoading }
}
