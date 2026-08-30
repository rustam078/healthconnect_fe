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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] })
      // The record page reads the same patient under its own key. Without this, editing
      // from that page saved the change and then went on showing the old values.
      qc.invalidateQueries({ queryKey: ['patientDetails'] })
    },
  })
}

export function useDeletePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deletePatient,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  })
}
