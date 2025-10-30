import axios from 'axios'
import { store } from '../store/store'
import { logout, loginSuccess } from '../store/authSlice'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: new Date() }
    
    // Try to get token from Redux store first, then fallback to localStorage
    let token = store.getState().auth.token
    
    if (!token) {
      token = localStorage.getItem('token')
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Debug log (remove in production)
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      hasToken: !!token
    })
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const endTime = new Date()
    const duration = endTime - response.config.metadata.startTime
    if (duration > 3000) {
      console.warn(`Slow API call: ${response.config.url} took ${duration}ms`)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Debug log
    console.error('API Error:', {
      url: originalRequest?.url,
      status: error.response?.status,
      message: error.response?.data?.error || error.response?.data?.message
    })

    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try Redux store first, then localStorage
        let refreshToken = store.getState().auth.refreshToken
        
        if (!refreshToken) {
          refreshToken = localStorage.getItem('refreshToken')
        }
        
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        })

        const { token, refreshToken: newRefreshToken } = response.data
        
        // Get user from Redux or localStorage
        let currentUser = store.getState().auth.user
        
        if (!currentUser) {
          const userStr = localStorage.getItem('user')
          currentUser = userStr ? JSON.parse(userStr) : null
        }
        
        // Update store with new tokens
        store.dispatch(loginSuccess({
          user: currentUser,
          token,
          refreshToken: newRefreshToken,
        }))

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        store.dispatch(logout())
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // Handle other errors
    if (error.response?.data?.error) {
      // Show error from backend
      if (error.response.status >= 500) {
        toast.error(error.response.data.error)
      } else if (error.response.status === 400) {
        // Show validation errors
        toast.error(error.response.data.error)
      }
    } else if (error.response?.data?.message) {
      if (error.response.status >= 500) {
        toast.error(error.response.data.message)
      }
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout - please try again')
    } else if (!error.response) {
      toast.error('Network error - please check your connection')
    }

    return Promise.reject(error)
  }
)

export default api