import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, createUser, updateUser, deleteUser } from './usersApi.js'

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: getUsers })
}

// Live form rule flagging a username already taken, checked against loaded users as the user types.
export function useUsernameTakenRule() {
  const { data: users } = useUsers()
  const taken = useMemo(
    () => new Set((users ?? []).map((u) => (u.username ?? '').trim().toLowerCase())),
    [users],
  )
  return {
    validator: (_rule, value) => {
      const v = (value ?? '').trim().toLowerCase()
      if (v && taken.has(v)) return Promise.reject(new Error('Username already taken'))
      return Promise.resolve()
    },
  }
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updateUser(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}
