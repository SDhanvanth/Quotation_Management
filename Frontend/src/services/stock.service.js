import api from './api'

const stockService = {
  getStockByStore: async (storeId, params = {}) => {
    const response = await api.get(`/stock/store/${storeId}`, { params })
    return response.data
  },

  updateStock: async (stockData) => {
    const response = await api.post('/stock/update', stockData)
    return response.data
  },

  transferStock: async (transferData) => {
    const response = await api.post('/stock/transfer', transferData)
    return response.data
  },

  getStockReport: async (params = {}) => {
    const response = await api.get('/stock/report', { params })
    return response.data
  },

  setStockLevels: async (levelData) => {
    const response = await api.post('/stock/levels', levelData)
    return response.data
  },

  getStockHistory: async (storeId, itemId, params = {}) => {
    const response = await api.get(`/stock/history/${storeId}/${itemId}`, { params })
    return response.data
  },

  getLowStockItems: async (storeId) => {
    const response = await api.get(`/stock/store/${storeId}/low-stock`)
    return response.data
  },

  getStockMovements: async (params = {}) => {
    const response = await api.get('/stock/movements', { params })
    return response.data
  },

  exportStockReport: async (params = {}) => {
    const response = await api.get('/stock/export', {
      params,
      responseType: 'blob',
    })
    return response.data
  },

  bulkUpdateStock: async (bulkData) => {
    // Accept both formats: { updates: [...] } or { store_id, updates: [...] }
    const response = await api.post('/stock/bulk-update', bulkData)
    return response.data
  },
}

export default stockService