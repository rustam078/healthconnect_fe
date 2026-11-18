import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from './communityApi.js'

export const useMyCommunities = () =>
  useQuery({ queryKey: ['communities'], queryFn: api.listMyCommunities })

export const useDiscover = () =>
  useQuery({ queryKey: ['communities', 'discover'], queryFn: api.discoverCommunities })

export const useMembers = (id) =>
  useQuery({ queryKey: ['community', id, 'members'], queryFn: () => api.getMembers(id), enabled: Boolean(id) })

function useInvalidateCommunities() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['communities'] })
}

export const useCreateCommunity = () => {
  const invalidate = useInvalidateCommunities()
  return useMutation({ mutationFn: api.createCommunity, onSuccess: invalidate })
}

export const useDeleteCommunity = () => {
  const invalidate = useInvalidateCommunities()
  return useMutation({ mutationFn: api.deleteCommunity, onSuccess: invalidate })
}

export const useJoin = () => {
  const invalidate = useInvalidateCommunities()
  return useMutation({ mutationFn: api.joinCommunity, onSuccess: invalidate })
}

export const useAddMembers = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, userIds }) => api.addMembers(id, userIds),
    onSuccess: (_d, { id }) => qc.invalidateQueries({ queryKey: ['community', id, 'members'] }),
  })
}

export const useRemoveMember = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, memberId }) => api.removeMember(id, memberId),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['community', id, 'members'] })
      qc.invalidateQueries({ queryKey: ['communities'] })
    },
  })
}
