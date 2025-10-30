import api from './api'

const userService = {
  getUsers: async (params = {}) => {
    // Remove empty string parameters
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== '')
    )
    const response = await api.get('/users', { params: cleanParams })
    return response.data
  },

  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  createUser: async (userData) => {
    const response = await api.post('/users', userData)
    return response.data
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData)
    return response.data
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  getProfile: async () => {
    const response = await api.get('/users/profile/me')
    return response.data
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile/me', profileData)
    return response.data
  },

  changePassword: async (passwordData) => {
    const response = await api.post('/users/change-password', passwordData)
    return response.data
  },

  getUserTypes: async () => {
    const response = await api.get('/users/types')
    return response.data
  },

  approveUser: async (userId, storeData = null) => {
    const response = await api.post(`/admin/approve-user/${userId}`, { storeData })
    return response.data
  },

  rejectUser: async (userId, reason) => {
    const response = await api.post(`/admin/reject-user/${userId}`, { reason })
    return response.data
  },

  getUnassignedStores: async () => {
    const response = await api.get('/admin/unassigned-stores')
    return response.data
  },

  getPendingApprovals: async () => {
    const response = await api.get('/admin/pending-approvals')
    return response.data
  }
}

export default userService