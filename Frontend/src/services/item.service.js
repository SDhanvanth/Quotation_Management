import api from './api';

export const itemService = {
  getItems: async (params = {}) => {
    try {
      const { page = 1, limit = 10, search = '', ...rest } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (search) queryParams.append('search', search);
      
      // Add any other params (sortBy, sortOrder, etc.)
      Object.entries(rest).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await api.get(`/items?${queryParams.toString()}`);
      console.log('Raw API Response:', response.data);

      // Return the raw response - let usePaginatedApi handle the processing
      return response.data;
    } catch (error) {
      console.error('Error in getItems:', error);
      throw error;
    }
  },

  getItemById: async (id) => {
    const response = await api.get(`/items/${id}`);
    return response.data;
  },

  createItem: async (data) => {
    // Ensure price is a number before sending
    const formattedData = {
      ...data,
      price: parseFloat(data.price || 0),
      category_id: parseInt(data.category_id)
    };

    const response = await api.post('/items', formattedData);
    console.log('Create item response:', response.data);
    return response.data;
  },

  updateItem: async (id, data) => {
    // Ensure price is a number before sending
    const formattedData = {
      ...data,
      price: parseFloat(data.price || 0),
      category_id: parseInt(data.category_id)
    };

    const response = await api.put(`/items/${id}`, formattedData);
    return response.data;
  },

  deleteItem: async (id) => {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  },
};

export default itemService;