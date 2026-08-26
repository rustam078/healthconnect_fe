import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDoctorDetails,
  saveAvailability,
  deleteAvailability,
  assignSpecialties,
  removeSpecialty,
} from './doctorDetailApi.js'

export function useDoctorDetails(doctorId) {
  return useQuery({
    queryKey: ['doctorDetails', doctorId],
    queryFn: () => getDoctorDetails(doctorId),
    enabled: doctorId != null && !Number.isNaN(doctorId),
  })
}

function useInvalidateDetails(doctorId) {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['doctorDetails', doctorId] })
}

// Sync the whole week in one action: delete days turned off, upsert the rest.
export function useSyncAvailability(doctorId) {
  const invalidate = useInvalidateDetails(doctorId)
  return useMutation({
    mutationFn: async ({ upsert, deleteIds }) => {
      for (const id of deleteIds) {
        await deleteAvailability(doctorId, id)
      }
      if (upsert.length) {
        await saveAvailability(doctorId, upsert)
      }
    },
    onSuccess: invalidate,
  })
}

export function useAssignSpecialties(doctorId) {
  const invalidate = useInvalidateDetails(doctorId)
  return useMutation({
    mutationFn: (specialtyIds) => assignSpecialties(doctorId, specialtyIds),
    onSuccess: invalidate,
  })
}

export function useRemoveSpecialty(doctorId) {
  const invalidate = useInvalidateDetails(doctorId)
  return useMutation({
    mutationFn: (specialtyId) => removeSpecialty(doctorId, specialtyId),
    onSuccess: invalidate,
  })
}
