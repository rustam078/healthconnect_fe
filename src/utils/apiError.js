// Resolve the most specific message from a wrapped API error.
// Prefers backend field-validation messages (fieldErrors) over the generic one.
export function getErrorMessage(error) {
  const fieldErrors = error?.fieldErrors
  if (fieldErrors && typeof fieldErrors === 'object') {
    const msgs = Object.values(fieldErrors).filter(Boolean)
    if (msgs.length) return msgs.join(' · ')
  }
  if (Array.isArray(error?.errors) && error.errors.length) {
    return error.errors.join(' · ')
  }
  if (error && typeof error.message === 'string' && error.message) {
    return error.message
  }
  return 'Something went wrong. Please try again.'
}
