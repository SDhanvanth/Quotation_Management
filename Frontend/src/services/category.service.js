import api from './api';

const categoryService = {
  // Get all categories with pagination
  getCategories: async (params = {}) => {
    const { page = 1, limit = 10, search = '', sortBy = '', sortOrder = '' } = params;
    
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    
    if (search) {
      queryParams.append('search', search);
    }
    
    if (sortBy) {
      queryParams.append('sortBy', sortBy);
      queryParams.append('sortOrder', sortOrder || 'asc');
    }
    
    const response = await api.get(`/categories?${queryParams.toString()}`);
    
    // Handle different response structures from your backend
    const data = response.data;
    
    // If the response has a specific structure, adapt it here
    if (data.categories) {
      return {
        data: data.categories,
        items: data.categories, // for compatibility with usePaginatedApi
        pagination: data.pagination || {
          page: parseInt(page),
          limit: parseInt(limit),
          total: data.total || data.categories.length,
          totalPages: data.totalPages || Math.ceil((data.total || data.categories.length) / limit)
        }
      };
    }
    
    // If data is directly an array
    if (Array.isArray(data)) {
      return {
        data: data,
        items: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: data.length,
          totalPages: 1
        }
      };
    }
    
    // Default structure
    return {
      data: data.data || [],
      items: data.data || [],
      pagination: data.pagination || {
        page: parseInt(page),
        limit: parseInt(limit),
        total: data.total || 0,
        totalPages: data.totalPages || 1
      }
    };
  },

  // Create a new category
  createCategory: async (categoryData) => {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  // Update a category
  updateCategory: async (categoryId, categoryData) => {
    const response = await api.put(`/categories/${categoryId}`, categoryData);
    return response.data;
  },

  // Delete a category
  deleteCategory: async (categoryId) => {
    const response = await api.delete(`/categories/${categoryId}`);
    return response.data;
  },

  // Get single category
  getCategoryById: async (categoryId) => {
    const response = await api.get(`/categories/${categoryId}`);
    return response.data;
  }
};

export default categoryService;