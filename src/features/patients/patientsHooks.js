import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
} from './patientsApi.js'

export function usePatients({ search, gender, bloodGroup, page = 1, size = 20 }) {
  return useQuery({
    queryKey: ['patients', { search, gender, bloodGroup, page, size }],
    queryFn: () => getPatients({ search, gender, bloodGroup, page: page - 1, size }),
    placeholderData: keepPreviousData,
  })
}

export function useCreatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createPatient,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  })
}

export function useUpdatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updatePatient(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  })
}

export function useDeletePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deletePatient,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  })
}
