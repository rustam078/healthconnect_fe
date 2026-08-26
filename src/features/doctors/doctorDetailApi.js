import axiosClient from '../../api/axiosClient.js'

export function getDoctorDetails(doctorId) {
  return axiosClient.get(`/doctors/details/${doctorId}`)
}

// Upsert weekly availability (one entry per day).
export function saveAvailability(doctorId, availability) {
  return axiosClient.post(`/doctors/${doctorId}/availability`, { availability })
}

export function deleteAvailability(doctorId, availabilityId) {
  return axiosClient.delete(`/doctors/${doctorId}/availability/${availabilityId}`)
}

export function assignSpecialties(doctorId, specialtyIds) {
  return axiosClient.post(`/doctors/${doctorId}/specialties`, { specialtyIds })
}

export function removeSpecialty(doctorId, specialtyId) {
  return axiosClient.delete(`/doctors/${doctorId}/specialties/${specialtyId}`)
}
