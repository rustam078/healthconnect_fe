import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getPatientDetails, getPatientAppointments } from './patientDetailApi.js'

export function usePatientDetails(patientId) {
  return useQuery({
    queryKey: ['patientDetails', patientId],
    queryFn: () => getPatientDetails(patientId),
    enabled: patientId != null && !Number.isNaN(patientId),
  })
}

// The visit history, one page at a time.
//
// keepPreviousData so paging does not blank the table between pages - the rows stay put
// and are replaced when the next page lands, instead of collapsing to a spinner and
// jumping the page around under the reader.
export function usePatientAppointments(patientId, page, size) {
  return useQuery({
    queryKey: ['patientAppointments', patientId, page, size],
    queryFn: () => getPatientAppointments(patientId, { page: page - 1, size }),
    enabled: patientId != null && !Number.isNaN(patientId),
    placeholderData: keepPreviousData,
  })
}
