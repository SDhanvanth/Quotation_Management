import api from './api';

const stockRequestService = {
  // Create new stock request
  createStockRequest: async (data) => {
    const response = await api.post('/stock-requests', data);
    return response.data;
  },

  // Get all stock requests (Admin)
  getStockRequests: async (params = {}) => {
    const response = await api.get('/stock-requests', { params });
    return response.data;
  },

  // Get my store's requests
  getMyStoreRequests: async (params = {}) => {
    const response = await api.get('/stock-requests/my-requests', { params });
    return response.data;
  },

  // Get stock request by ID
  getStockRequestById: async (id) => {
    const response = await api.get(`/stock-requests/${id}`);
    return response.data;
  },

  // Get grouped requests by item (Admin - for quotation creation)
  getGroupedRequestsByItem: async (params = {}) => {
    const response = await api.get('/stock-requests/grouped-by-item', { params });
    return response.data;
  },

  // Update request status (Admin)
  updateRequestStatus: async (id, data) => {
    const response = await api.put(`/stock-requests/${id}/status`, data);
    return response.data;
  },

  // Delete stock request
  deleteStockRequest: async (id) => {
    const response = await api.delete(`/stock-requests/${id}`);
    return response.data;
  },
};

export default stockRequestService;