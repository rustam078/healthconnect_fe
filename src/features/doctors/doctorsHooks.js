import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from './doctorsApi.js'

export function useDoctors({ search, filter, page = 1, size = 20 }) {
  return useQuery({
    queryKey: ['doctors', { search, filter, page, size }],
    queryFn: () => getDoctors({ search, filter, page: page - 1, size }),
    placeholderData: keepPreviousData,
  })
}

export function useCreateDoctor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createDoctor,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctors'] }),
  })
}

export function useUpdateDoctor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updateDoctor(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctors'] }),
  })
}

export function useDeleteDoctor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteDoctor,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctors'] }),
  })
}
