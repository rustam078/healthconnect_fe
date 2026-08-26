import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  getSpecialties,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
} from './specialtiesApi.js'

export function useSpecialties({ search, page = 1, size = 20 }) {
  return useQuery({
    queryKey: ['specialties', { search, page, size }],
    queryFn: () => getSpecialties({ search, page: page - 1, size }),
    placeholderData: keepPreviousData,
  })
}

export function useCreateSpecialty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createSpecialty,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specialties'] }),
  })
}

export function useUpdateSpecialty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updateSpecialty(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specialties'] }),
  })
}

export function useDeleteSpecialty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteSpecialty,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specialties'] }),
  })
}
