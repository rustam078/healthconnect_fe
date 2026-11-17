import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  uploadReport, getReports, getLabOrders, uploadReportForTest, removeReportFromTest, deleteOrderedTest,
} from './reportsApi.js'

// Appointments that have lab orders (paginated, filter by appointment id).
export function useLabOrders({ appointmentId, page = 1, size = 10 }) {
  return useQuery({
    queryKey: ['lab-orders', appointmentId, page, size],
    queryFn: () => getLabOrders({ appointmentId, page: page - 1, size }),
    placeholderData: keepPreviousData,
  })
}

export function useUploadReportForTest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderedTestId, formData }) => uploadReportForTest(orderedTestId, formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lab-orders'] }),
  })
}

export function useRemoveReportFromTest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: removeReportFromTest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lab-orders'] }),
  })
}

export function useDeleteOrderedTest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteOrderedTest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lab-orders'] }),
  })
}

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
