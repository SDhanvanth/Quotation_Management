// services/report.service.js
import api from './api';

const reportService = {
  // Item Reports
  getItemReport: async (filters) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active);

    const response = await api.get(`/reports/items?${params.toString()}`);
    return response.data;
  },

  exportItemReport: async (filters) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active);

    const response = await api.get(`/reports/items/export?${params.toString()}`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `items_report_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // Stock Reports
  getStockReport: async (filters) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.store_id) params.append('store_id', filters.store_id);
    if (filters.low_stock_only !== undefined) params.append('low_stock_only', filters.low_stock_only);

    const response = await api.get(`/reports/stock?${params.toString()}`);
    return response.data;
  },

  exportStockReport: async (filters) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.store_id) params.append('store_id', filters.store_id);
    if (filters.low_stock_only !== undefined) params.append('low_stock_only', filters.low_stock_only);

    const response = await api.get(`/reports/stock/export?${params.toString()}`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stock_report_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // Store Reports (Admin only)
  getStoreReport: async (filters) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active);

    const response = await api.get(`/reports/stores?${params.toString()}`);
    return response.data;
  },

  exportStoreReport: async (filters) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active);

    const response = await api.get(`/reports/stores/export?${params.toString()}`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stores_report_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // Retailer Reports (Admin only)
  getRetailerReport: async (filters) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.is_verified !== undefined) params.append('is_verified', filters.is_verified);

    const response = await api.get(`/reports/retailers?${params.toString()}`);
    return response.data;
  },

  exportRetailerReport: async (filters) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.is_verified !== undefined) params.append('is_verified', filters.is_verified);

    const response = await api.get(`/reports/retailers/export?${params.toString()}`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `retailers_report_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // Quotation Reports
  getQuotationReport: async (filters) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status_id) params.append('status_id', filters.status_id);
    if (filters.quotation_type) params.append('quotation_type', filters.quotation_type);
    if (filters.created_by) params.append('created_by', filters.created_by);

    const response = await api.get(`/reports/quotations?${params.toString()}`);
    return response.data;
  },

  exportQuotationReport: async (filters) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status_id) params.append('status_id', filters.status_id);
    if (filters.quotation_type) params.append('quotation_type', filters.quotation_type);
    if (filters.created_by) params.append('created_by', filters.created_by);

    const response = await api.get(`/reports/quotations/export?${params.toString()}`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `quotations_report_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

export default reportService;