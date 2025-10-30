// services/quotation.service.js (FIXED - COMPLETE FILE)
import api from './api'

const quotationService = {
  // ✅ FIXED - Get all quotations with proper param cleaning
  getQuotations: async (params = {}) => {
    // Clean up params - remove empty, null, or undefined values
    const cleanParams = {};
    
    Object.keys(params).forEach(key => {
      const value = params[key];
      // Only include non-empty values
      if (value !== '' && value !== null && value !== undefined && value !== 'undefined' && value !== 'null') {
        cleanParams[key] = value;
      }
    });
    
    const response = await api.get('/quotations', { params: cleanParams });
    return response.data;
  },

  // Get quotation by ID
  getQuotationById: async (id) => {
    const response = await api.get(`/quotations/${id}`)
    return response.data
  },

  // Create quotation from stock requests
  createQuotationFromStockRequests: async (data) => {
    const response = await api.post('/quotations/from-stock-requests', data)
    return response.data
  },

  // Create regular quotation
  createQuotation: async (quotationData) => {
    const response = await api.post('/quotations', quotationData)
    return response.data
  },

  // Update quotation
  updateQuotation: async (id, quotationData) => {
    const response = await api.put(`/quotations/${id}`, quotationData)
    return response.data
  },

  // Update quotation status (for closing early)
  updateQuotationStatus: async (quotationId, status) => {
    const response = await api.put(`/quotations/${quotationId}/status`, { 
      status 
    })
    return response.data
  },

  // Delete quotation
  deleteQuotation: async (id) => {
    const response = await api.delete(`/quotations/${id}`)
    return response.data
  },

  // Submit retailer response
  submitRetailerResponse: async (data) => {
    const { quotation_id, retailer_id, items, notes } = data
    const response = await api.post(`/quotations/${quotation_id}/retailer-response`, {
      retailer_id,
      items,
      notes
    })
    return response.data
  },

  // Get retailer responses for a quotation
  getRetailerResponses: async (quotationId) => {
    const response = await api.get(`/quotations/${quotationId}/responses`)
    return response.data
  },

  // Get award comparison data
  getAwardComparison: async (quotationId) => {
    const response = await api.get(`/quotations/${quotationId}/award-comparison`)
    return response.data
  },

  // Award quotation
  awardQuotation: async (quotationId, awards) => {
    const response = await api.post(`/quotations/${quotationId}/award`, { awards })
    return response.data
  },

  // Get quotation statistics
  getQuotationStats: async () => {
    const response = await api.get('/quotations/statistics')
    return response.data
  },

  // Get retailer's own quotations
  getRetailerQuotations: async (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== '' && value !== null && value !== undefined) {
        cleanParams[key] = value;
      }
    });
    const response = await api.get('/quotations/retailer/my-quotations', { params: cleanParams })
    return response.data
  },

  // Get specific retailer quotation by ID
  getRetailerQuotationById: async (quotationId) => {
    const response = await api.get(`/quotations/retailer/${quotationId}`)
    return response.data
  },

  // Save retailer response as draft
  saveRetailerDraft: async (data) => {
    const { quotation_id, items, notes } = data
    const response = await api.post(`/quotations/${quotation_id}/retailer-response/draft`, {
      items,
      notes
    })
    return response.data
  },

  // Get retailer's draft response
  getRetailerDraft: async (quotationId) => {
    const response = await api.get(`/quotations/${quotationId}/retailer-response/draft`)
    return response.data
  },

  // Publish quotation
  publishQuotation: async (quotationId) => {
    const response = await api.post(`/quotations/${quotationId}/publish`)
    return response.data
  },

  // Cancel/Withdraw quotation
  cancelQuotation: async (quotationId, reason = '') => {
    const response = await api.post(`/quotations/${quotationId}/cancel`, { reason })
    return response.data
  },

  // Extend quotation deadline
  extendDeadline: async (quotationId, newDeadline) => {
    const response = await api.put(`/quotations/${quotationId}/extend-deadline`, {
      validity_until: newDeadline
    })
    return response.data
  },

  // Get quotation history
  getQuotationHistory: async (quotationId) => {
    const response = await api.get(`/quotations/${quotationId}/history`)
    return response.data
  },

  // Export quotation
  exportQuotation: async (id, format = 'pdf') => {
    const response = await api.get(`/quotations/${id}/export`, {
      params: { format },
      responseType: 'blob',
    })
    return response.data
  },

  // Export award summary
  exportAwardSummary: async (quotationId, format = 'pdf') => {
    const response = await api.get(`/quotations/${quotationId}/award-summary/export`, {
      params: { format },
      responseType: 'blob',
    })
    return response.data
  },

  // Send reminder to retailers
  sendReminderToRetailers: async (quotationId, retailerIds = []) => {
    const response = await api.post(`/quotations/${quotationId}/send-reminder`, {
      retailer_ids: retailerIds
    })
    return response.data
  },

  // Get quotations by status
  getQuotationsByStatus: async (status, params = {}) => {
    const cleanParams = { ...params };
    if (status) {
      cleanParams.status = status;
    }
    Object.keys(cleanParams).forEach(key => {
      const value = cleanParams[key];
      if (value === '' || value === null || value === undefined) {
        delete cleanParams[key];
      }
    });
    const response = await api.get('/quotations', { params: cleanParams })
    return response.data
  },

  // Bulk delete quotations
  bulkDeleteQuotations: async (quotationIds) => {
    const response = await api.post('/quotations/bulk-delete', {
      quotation_ids: quotationIds
    })
    return response.data
  },

  // Bulk update status
  bulkUpdateStatus: async (quotationIds, status) => {
    const response = await api.post('/quotations/bulk-update-status', {
      quotation_ids: quotationIds,
      status
    })
    return response.data
  },

  // Get comparative analysis
  getComparativeAnalysis: async (quotationId) => {
    const response = await api.get(`/quotations/${quotationId}/comparative-analysis`)
    return response.data
  },

  // Clone/Duplicate quotation
  cloneQuotation: async (quotationId, newData = {}) => {
    const response = await api.post(`/quotations/${quotationId}/clone`, newData)
    return response.data
  },
}

export default quotationService