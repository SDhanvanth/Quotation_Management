export const USER_TYPES = {
  ADMIN: 'admin',
  STORE: 'store',
  RETAILER: 'retailer',
}

export const QUOTATION_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CLOSED: 'closed',
  AWARDED: 'awarded',
  CANCELLED: 'cancelled',
}

export const OTP_TYPES = {
  REGISTRATION: 'registration',
  LOGIN: 'login',
  PASSWORD_RESET: 'password_reset',
  EMAIL_VERIFICATION: 'email_verification',
}

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  ADMIN_DASHBOARD: '/admin',
  STORE_DASHBOARD: '/store',
  RETAILER_DASHBOARD: '/retailer',
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
  },
  USERS: {
    PROFILE: '/users/profile/me',
    LIST: '/users',
  },
  QUOTATIONS: {
    LIST: '/quotations',
    CREATE: '/quotations',
    DETAIL: (id) => `/quotations/${id}`,
  },
}