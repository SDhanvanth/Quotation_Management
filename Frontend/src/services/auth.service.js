import api from './api'

const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  verifyEmail: async (data) => {
    const response = await api.post('/auth/verify-email', data)
    return response.data
  },

  loginWithOTP: async (username) => {
    const response = await api.post('/auth/login-otp', { username })
    return response.data
  },

  verifyLoginOTP: async (data) => {
    const response = await api.post('/auth/verify-login-otp', data)
    return response.data
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data)
    return response.data
  },

  resendOTP: async (data) => {
    const response = await api.post('/auth/resend-otp', data)
    return response.data
  },

  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },

  getProfile: async () => {
    const response = await api.get('/users/profile/me')
    return response.data
  },

  updateProfile: async (data) => {
    const response = await api.put('/users/profile/me', data)
    return response.data
  },
}

export default authService