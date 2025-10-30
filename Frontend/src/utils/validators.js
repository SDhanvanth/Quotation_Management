export const validators = {
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!value) return 'Email is required'
    if (!emailRegex.test(value)) return 'Invalid email address'
    return true
  },

  password: (value) => {
    if (!value) return 'Password is required'
    if (value.length < 6) return 'Password must be at least 6 characters'
    return true
  },

  username: (value) => {
    if (!value) return 'Username is required'
    if (value.length < 3) return 'Username must be at least 3 characters'
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores'
    return true
  },

  phone: (value) => {
    const phoneRegex = /^[6-9]\d{9}$/
    if (!value) return 'Phone number is required'
    if (!phoneRegex.test(value)) return 'Invalid phone number'
    return true
  },

  gst: (value) => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    if (value && !gstRegex.test(value)) return 'Invalid GST number'
    return true
  },

  pan: (value) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    if (value && !panRegex.test(value)) return 'Invalid PAN number'
    return true
  },

  otp: (value) => {
    if (!value) return 'OTP is required'
    if (!/^\d{6}$/.test(value)) return 'OTP must be 6 digits'
    return true
  },

  required: (fieldName) => (value) => {
    if (!value || value.toString().trim() === '') return `${fieldName} is required`
    return true
  },

  minLength: (fieldName, min) => (value) => {
    if (value && value.length < min) return `${fieldName} must be at least ${min} characters`
    return true
  },

  maxLength: (fieldName, max) => (value) => {
    if (value && value.length > max) return `${fieldName} must not exceed ${max} characters`
    return true
  },

  match: (fieldName, matchValue) => (value) => {
    if (value !== matchValue) return `${fieldName} do not match`
    return true
  },
}