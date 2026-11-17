import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getModules,
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
} from './rolesApi.js'

export function useModules() {
  return useQuery({ queryKey: ['modules'], queryFn: getModules, staleTime: Infinity })
}

export function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: getRoles })
}

export function useRole(id) {
  return useQuery({ queryKey: ['roles', id], queryFn: () => getRole(id), enabled: !!id })
}

export function useCreateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  })
}

export function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updateRole(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  })
}

export function useDeleteRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  })
}
