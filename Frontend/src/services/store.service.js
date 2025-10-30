import api from './api'

const storeService = {
  // Setup store on first login
  setupStore: async (storeData) => {
    const response = await api.post('/stores/setup', storeData)
    return response.data
  },

  // Get my store profile
  getMyProfile: async () => {
    const response = await api.get('/stores/my-profile')
    return response.data
  },

  getStores: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== '')
    )
    const response = await api.get('/stores', { params: cleanParams })
    return response.data
  },

  getStoreById: async (id) => {
    const response = await api.get(`/stores/${id}`)
    return response.data
  },

  updateStore: async (id, storeData) => {
    const response = await api.put(`/stores/${id}`, storeData)
    return response.data
  },

  deleteStore: async (id) => {
    const response = await api.delete(`/stores/${id}`)
    return response.data
  },

  getStoreStock: async (id, params = {}) => {
    const response = await api.get(`/stores/${id}/stock`, { params })
    return response.data
  },
}

export default storeService