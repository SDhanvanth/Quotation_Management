import api from './api'

const retailerService = {
  // Setup retailer on first login
  setupRetailer: async (retailerData) => {
    // Clean up the data - remove empty strings and 'Nil' values
    const cleanedData = Object.entries(retailerData).reduce((acc, [key, value]) => {
      if (value && value.toString().trim() !== '' && value.toString().toLowerCase() !== 'nil') {
        acc[key] = typeof value === 'string' ? value.trim() : value
      }
      return acc
    }, {})

    const response = await api.post('/retailers/setup', cleanedData)
    return response.data
  },

  // Get my retailer profile
  getMyProfile: async () => {
    const response = await api.get('/retailers/my-profile')
    return response.data
  },

  // Get retailers (regular endpoint)
  getRetailers: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== '')
    )
    const response = await api.get('/retailers', { params: cleanParams })
    return response.data
  },

  // Admin: Get all retailers
  getRetailersAdmin: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== '')
    )
    const response = await api.get('/admin/retailers', { params: cleanParams })
    return response.data
  },

  getRetailerById: async (id) => {
    const response = await api.get(`/retailers/${id}`)
    return response.data
  },

  updateRetailer: async (id, retailerData) => {
    const response = await api.put(`/retailers/${id}`, retailerData)
    return response.data
  },

  // Admin: Update retailer
  updateRetailerAdmin: async (id, retailerData) => {
    const response = await api.put(`/admin/retailers/${id}`, retailerData)
    return response.data
  },

  deleteRetailer: async (id) => {
    const response = await api.delete(`/retailers/${id}`)
    return response.data
  },

  getRetailerQuotations: async (id, params = {}) => {
    const response = await api.get(`/retailers/${id}/quotations`, { params })
    return response.data
  },

  // Admin: Get retailer quotations
  getRetailerQuotationsAdmin: async (id, params = {}) => {
    const response = await api.get(`/admin/retailers/${id}/quotations`, { params })
    return response.data
  },
}

export default retailerService