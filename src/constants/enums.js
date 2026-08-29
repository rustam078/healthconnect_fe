export const GENDER_OPTIONS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' },
]

export const BLOOD_GROUP_OPTIONS = [
  { label: 'A+', value: 'A_POSITIVE' },
  { label: 'A-', value: 'A_NEGATIVE' },
  { label: 'B+', value: 'B_POSITIVE' },
  { label: 'B-', value: 'B_NEGATIVE' },
  { label: 'AB+', value: 'AB_POSITIVE' },
  { label: 'AB-', value: 'AB_NEGATIVE' },
  { label: 'O+', value: 'O_POSITIVE' },
  { label: 'O-', value: 'O_NEGATIVE' },
]

export const APPOINTMENT_STATUS_OPTIONS = [
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

export const DAY_OF_WEEK_OPTIONS = [
  { label: 'Monday', value: 'MONDAY' },
  { label: 'Tuesday', value: 'TUESDAY' },
  { label: 'Wednesday', value: 'WEDNESDAY' },
  { label: 'Thursday', value: 'THURSDAY' },
  { label: 'Friday', value: 'FRIDAY' },
  { label: 'Saturday', value: 'SATURDAY' },
  { label: 'Sunday', value: 'SUNDAY' },
]

// Every enum the API sends, keyed by its stored value. One map so a display label is
// looked up the same way wherever it is needed - a table cell, a chart axis, a filter
// chip - rather than each screen inventing its own translation.
const LABEL_BY_VALUE = new Map(
  [
    ...GENDER_OPTIONS,
    ...BLOOD_GROUP_OPTIONS,
    ...APPOINTMENT_STATUS_OPTIONS,
    ...DAY_OF_WEEK_OPTIONS,
  ].map((option) => [option.value, option.label]),
)

// A stored enum value as a person should read it: A_NEGATIVE -> A-, ON_LEAVE -> On leave.
//
// The database keeps the identity and the screen shows the label - the backend cannot hold
// "A-" because it is not a valid Java identifier, and nobody wants to read A_NEGATIVE.
//
// Anything that is not an enum is returned untouched. The guard is deliberately narrow:
// only UPPER_SNAKE_CASE words are guessed at, so a patient code like PAT03915 or a name in
// capitals is never rewritten.
export function enumLabel(value) {
  if (typeof value !== 'string' || value === '') return value

  const known = LABEL_BY_VALUE.get(value)
  if (known) return known

  if (!/^[A-Z][A-Z]*(_[A-Z]+)+$/.test(value)) return value
  const words = value.toLowerCase().split('_')
  return words[0].charAt(0).toUpperCase() + words[0].slice(1) + (words.length > 1 ? ' ' + words.slice(1).join(' ') : '')
}
