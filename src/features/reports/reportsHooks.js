import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadReport, getReports } from './reportsApi.js'

export function useReports(patientId) {
  return useQuery({
    queryKey: ['reports', patientId],
    queryFn: () => getReports(patientId),
    enabled: !!patientId,
  })
}

export function useUploadReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: uploadReport,
    onSuccess: (_data, formData) =>
      qc.invalidateQueries({ queryKey: ['reports', formData.get('patientId')] }),
  })
}
