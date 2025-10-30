import { createSlice } from '@reduxjs/toolkit'

// Get initial state from localStorage
const getInitialState = () => {
  const token = localStorage.getItem('token')
  const refreshToken = localStorage.getItem('refreshToken')
  const user = localStorage.getItem('user')

  if (token && user) {
    return {
      user: JSON.parse(user),
      token,
      refreshToken,
      isAuthenticated: true,
      loading: false,
      error: null,
    }
  }

  return {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    loginStart: (state) => {
      state.loading = true
      state.error = null
    },
    loginSuccess: (state, action) => {
      state.loading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      state.token = action.payload.token
      state.refreshToken = action.payload.refreshToken
      state.error = null
      
      // Save to localStorage
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('refreshToken', action.payload.refreshToken)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    },
    loginFailure: (state, action) => {
      state.loading = false
      state.isAuthenticated = false
      state.error = action.payload
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.error = null
      
      // Clear localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
      localStorage.setItem('user', JSON.stringify(state.user))
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  clearError,
} = authSlice.actions

export default authSlice.reducer