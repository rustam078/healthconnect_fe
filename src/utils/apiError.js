export function getErrorMessage(error) {
  if (error && typeof error.message === 'string' && error.message) {
    return error.message
  }
  return 'Something went wrong. Please try again.'
}
