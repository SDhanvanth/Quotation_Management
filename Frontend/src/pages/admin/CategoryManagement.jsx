import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/forms/Button';
import Input from '../../components/forms/Input';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { usePaginatedApi, useApi } from '../../hooks/useApi';
import categoryService from '../../services/category.service';
import toast from 'react-hot-toast';

const CategoryManagement = () => {
  const { token } = useSelector((state) => state.auth);
  const [search, setSearch] = useState('');
  const [searchTrigger, setSearchTrigger] = useState('');
  
  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    category_name: '',
    category_description: '',
    is_active: true
  });

  // Use paginated API hook for fetching categories
  const {
    data: categories,
    pagination,
    loading,
    error,
    fetchData: fetchCategories,
    goToPage
  } = usePaginatedApi(
    (params) => categoryService.getCategories(params),
    1,
    10
  );

  // API hooks for CRUD operations
  const createCategoryApi = useApi(categoryService.createCategory, false);
  const updateCategoryApi = useApi(categoryService.updateCategory, false);
  const deleteCategoryApi = useApi(categoryService.deleteCategory, false);

  // Define columns with serial number
  const columns = [
    { 
      key: 'category_name', 
      label: 'Category Name',
      sortable: true
    },
    { 
      key: 'category_description', 
      label: 'Description',
      sortable: false,
      render: (value) => value || '-'
    },
    { 
      key: 'is_active', 
      label: 'Status',
      sortable: true,
      render: (value) => (
        value ? (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Active
          </span>
        ) : (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Inactive
          </span>
        )
      )
    },
    { 
      key: 'actions', 
      label: 'Actions',
      sortable: false,
      render: (value, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
            title="Edit"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="text-red-600 hover:text-red-800 p-1 transition-colors"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  // Fetch categories on mount and when page changes
  useEffect(() => {
    if (token) {
      fetchCategories(pagination.page, pagination.limit, { search: searchTrigger });
    }
  }, [token, pagination.page]);

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchTrigger(search);
      if (token) {
        fetchCategories(1, pagination.limit, { search });
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleAdd = () => {
    setFormData({
      category_name: '',
      category_description: '',
      is_active: true
    });
    setSelectedCategory(null);
    setAddModalOpen(true);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({
      category_name: category.category_name || '',
      category_description: category.category_description || '',
      is_active: category.is_active !== undefined ? category.is_active : true
    });
    setEditModalOpen(true);
  };

  const handleDelete = (category) => {
    setSelectedCategory(category);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedCategory) {
        await updateCategoryApi.execute(selectedCategory.category_id, formData);
        toast.success('Category updated successfully');
      } else {
        await createCategoryApi.execute(formData);
        toast.success('Category created successfully');
      }

      // Refresh the categories list
      await fetchCategories(pagination.page, pagination.limit, { search: searchTrigger });
      
      // Close modals
      setAddModalOpen(false);
      setEditModalOpen(false);
      setSelectedCategory(null);
      
      // Reset form
      setFormData({
        category_name: '',
        category_description: '',
        is_active: true
      });
      
    } catch (error) {
      // Error is already handled by useApi hook
      console.error('Error saving category:', error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCategoryApi.execute(selectedCategory.category_id);
      toast.success('Category deleted successfully');

      // If we deleted the last item on a page (except page 1), go to previous page
      if (categories.length === 1 && pagination.page > 1) {
        goToPage(pagination.page - 1);
      } else {
        // Otherwise, just refresh current page
        await fetchCategories(pagination.page, pagination.limit, { search: searchTrigger });
      }
      
      // Close modal
      setDeleteModalOpen(false);
      setSelectedCategory(null);
      
    } catch (error) {
      // Error is already handled by useApi hook
      console.error('Error deleting category:', error);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handlePageChange = (newPage) => {
    goToPage(newPage);
  };

  const handleSort = (field, direction) => {
    console.log('Sorting by:', field, direction);
    // Implement sorting by passing sort params to fetchCategories
    fetchCategories(1, pagination.limit, { 
      search: searchTrigger,
      sortBy: field,
      sortOrder: direction 
    });
  };

  // Check authentication
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Please login to access this page</p>
        </div>
      </div>
    );
  }

  // Show any API errors
  const displayError = error || createCategoryApi.error || updateCategoryApi.error || deleteCategoryApi.error;

  // Debug log
  console.log('Categories data:', categories);
  console.log('Pagination:', pagination);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
        <Button 
          variant="primary" 
          onClick={handleAdd}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Category
        </Button>
      </div>

      {/* Error Alert */}
      {displayError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{displayError}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => window.location.reload()}
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}

      <Card>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <Input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={handleSearchChange}
              className="max-w-xs"
            />
            <div className="text-sm text-gray-600">
              {!loading && categories && (
                <span>
                  Showing {categories.length} of {pagination.total} categories
                </span>
              )}
            </div>
          </div>

          {/* Table Component */}
          <Table
            columns={columns}
            data={categories || []}
            loading={loading}
            sortable={true}
            onSort={handleSort}
            emptyMessage={search ? "No categories found matching your search" : "No categories available. Click 'Add New Category' to create one."}
          />

          {/* Pagination */}
          {!loading && categories && categories.length > 0 && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-4">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Add/Edit Category Modal */}
      <Modal
        isOpen={addModalOpen || editModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setEditModalOpen(false);
          setSelectedCategory(null);
          setFormData({
            category_name: '',
            category_description: '',
            is_active: true
          });
        }}
        title={selectedCategory ? 'Edit Category' : 'Add New Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <Input
              type="text"
              value={formData.category_name}
              onChange={(e) => setFormData({
                ...formData,
                category_name: e.target.value
              })}
              required
              placeholder="Enter category name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              rows="3"
              placeholder="Enter category description (optional)"
              value={formData.category_description || ''}
              onChange={(e) => setFormData({
                ...formData,
                category_description: e.target.value
              })}
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({
                ...formData,
                is_active: e.target.checked
              })}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Active
            </label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setAddModalOpen(false);
                setEditModalOpen(false);
                setSelectedCategory(null);
                setFormData({
                  category_name: '',
                  category_description: '',
                  is_active: true
                });
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createCategoryApi.loading || updateCategoryApi.loading}
            >
              {createCategoryApi.loading || updateCategoryApi.loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                selectedCategory ? 'Save Changes' : 'Add Category'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedCategory(null);
        }}
        title="Delete Category"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedCategory?.category_name}</strong>? 
            {' '}This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedCategory(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={deleteCategoryApi.loading}
            >
              {deleteCategoryApi.loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Delete Category'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoryManagement;