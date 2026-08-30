export const PROFILE_MAX = 600
export const MAX_TAGS = 20
export const MAX_TAG_LENGTH = 30

const NAME_PATTERN = /^[\p{L}][\p{L}' -]*$/u
const TEXT_PATTERN = /^[\p{L}\p{N} .,'&()°/-]*$/u
const TAG_PATTERN = /^[\p{L}\p{N} #+./-]+$/u
const TEXT_MESSAGE = "Use letters, numbers and . , ' & ( ) / - only."

export const validators = {
  fullName: (value) => {
    const text = value.trim()
    if (!text) return 'Full name is required.'
    if (text.length < 2 || text.length > 80) return 'Use 2 to 80 characters.'
    if (!NAME_PATTERN.test(text)) return 'Use letters, spaces and hyphens only.'
    return ''
  },

  dateOfBirth: (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Enter a valid date.'
    if (date > new Date()) return 'Enter a date in the past.'
    const age = new Date().getFullYear() - date.getFullYear()
    if (age < 14 || age > 100) return 'Age must be between 14 and 100.'
    return ''
  },

  email: (value) => {
    const text = value.trim()
    if (!text) return 'Email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text)) {
      return 'Enter a valid email, e.g. name@domain.com.'
    }
    return ''
  },

  identification: (value) => {
    const text = value.trim()
    if (!text) return ''
    if (text.length > 20) return 'Use 20 characters or fewer.'
    if (!/^[A-Za-z0-9 .:-]+$/.test(text)) {
      return 'Use letters and numbers only, e.g. DNI: 45758863.'
    }
    return ''
  },

  phone: (value) => {
    const text = value.trim()
    if (!text) return ''
    if (text.length < 7 || text.length > 20) return 'Use 7 to 20 characters.'
    if (!/^[0-9+() -]+$/.test(text)) return 'Use digits and + - ( ) only.'
    return ''
  },

  github: (value) => {
    const text = value.trim()
    if (!text) return ''
    if (!/^https:\/\/github\.com\/[A-Za-z0-9-]+\/?$/.test(text)) {
      return 'Use the form https://github.com/your-user'
    }
    return ''
  },

  linkedin: (value) => {
    const text = value.trim()
    if (!text) return ''
    if (!/^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9-]+\/?$/.test(text)) {
      return 'Use the form https://linkedin.com/in/your-user'
    }
    return ''
  },
}

export function validateText(
  value,
  {
    isRequired = false,
    maxLength = 80,
    pattern = TEXT_PATTERN,
    message = TEXT_MESSAGE,
  } = {}
) {
  const text = value.trim()
  if (!text) return isRequired ? 'This field is required.' : ''
  if (text.length > maxLength) return `Use ${maxLength} characters or fewer.`
  if (pattern && !pattern.test(text)) return message
  return ''
}

const DATE_RANGE = /^\d{4}\s*[-\u2013\u2014]\s*(\d{4}|present)$/i
const POINT_IN_TIME = /^([A-Za-z]{3,9}\s+\d{4}|\d{4})$/
const UNTIL = /^([A-Za-z]{3,9}\s+\d{4}|\d{4}|present)$/i

export const educationValidators = {
  school: (value) => validateText(value, { isRequired: true }),
  title: (value) => validateText(value, { isRequired: true }),
  date: (value) => {
    const text = value.trim()
    if (!text) return 'This field is required.'
    if (!DATE_RANGE.test(text)) return 'Use YYYY - YYYY or YYYY - Present.'
    return ''
  },
}

export const experienceValidators = {
  company: (value) => validateText(value, { isRequired: true }),
  position: (value) => validateText(value, { isRequired: true }),
  responsibilities: (value) =>
    validateText(value, { maxLength: 1000, pattern: null }),
  from: (value) => {
    const text = value.trim()
    if (!text) return 'This field is required.'
    if (!POINT_IN_TIME.test(text)) return 'Use Jan 2022 or 2022.'
    return ''
  },
  until: (value) => {
    const text = value.trim()
    if (!text) return 'This field is required.'
    if (!UNTIL.test(text)) return 'Use Jan 2022, 2022 or Present.'
    return ''
  },
}

export function runValidators(values, fieldValidators) {
  const errors = {}
  let firstInvalid = ''
  for (const [key, validate] of Object.entries(fieldValidators)) {
    const message = validate(values[key] ?? '')
    if (message) {
      errors[key] = message
      if (!firstInvalid) firstInvalid = key
    }
  }
  return { errors, firstInvalid }
}

export function validateTagInput(input, tags) {
  const text = input.trim()
  if (!text) return ''
  if (text.length > MAX_TAG_LENGTH) {
    return `Max ${MAX_TAG_LENGTH} characters per tag.`
  }
  if (tags.includes(text)) return 'Already added.'
  if (tags.length >= MAX_TAGS) return `Up to ${MAX_TAGS} tags.`
  if (!TAG_PATTERN.test(text)) return 'Use letters, numbers and # + . / - only.'
  return ''
}
