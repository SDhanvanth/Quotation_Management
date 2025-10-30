import { format, formatDistance, parseISO } from 'date-fns'

export const formatDate = (date, formatString = 'dd MMM yyyy') => {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatString)
}

export const formatDateTime = (date) => {
  return formatDate(date, 'dd MMM yyyy, hh:mm a')
}

export const formatRelativeTime = (date) => {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatDistance(dateObj, new Date(), { addSuffix: true })
}

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const getInitials = (name) => {
  if (!name) return ''
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.response?.data?.error) {
    return error.response.data.error
  }
  if (error.message) {
    return error.message
  }
  return 'An unexpected error occurred'
}

export const downloadFile = (data, filename, type = 'application/json') => {
  const blob = new Blob([data], { type })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    case 'published':
      return 'bg-blue-100 text-blue-800'
    case 'closed':
      return 'bg-yellow-100 text-yellow-800'
    case 'awarded':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'inactive':
      return 'bg-red-100 text-red-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'approved':
      return 'bg-green-100 text-green-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export const getUserTypeColor = (type) => {
  switch (type?.toLowerCase()) {
    case 'admin':
      return 'bg-purple-100 text-purple-800'
    case 'store':
      return 'bg-blue-100 text-blue-800'
    case 'retailer':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export const maskEmail = (email) => {
  if (!email) return ''
  const [username, domain] = email.split('@')
  const maskedUsername = username.substring(0, 2) + '***'
  return `${maskedUsername}@${domain}`
}