import { useState, useEffect } from 'react';
import { usePaginatedApi } from '../../hooks/useApi';
import { itemService } from '../../services/item.service';
import categoryService from '../../services/category.service';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/forms/Button';
import Input from '../../components/forms/Input';
import Modal from '../../components/ui/Modal';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ItemManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    item_name: '',
    item_code: '',
    item_description: '',
    category_id: '',
    unit_of_measure: '',
    price: '',
    is_active: true
  });

  // Use paginated API hook for items
  const {
    data: items = [],
    pagination = { page: 1, limit: 10, total: 0, totalPages: 0 },
    loading,
    error,
    fetchData,
    goToPage,
    nextPage,
    previousPage,
  } = usePaginatedApi(itemService.getItems, 1, 10);

  // Map items with category names
  const itemsWithCategories = Array.isArray(items) ? items.map(item => {
    const category = categories.find(c => c.category_id === parseInt(item.category_id));
    return {
      ...item,
      category_name: item.Category?.category_name || category?.category_name || '-',
      price: parseFloat(item.price || 0)
    };
  }) : [];

  // Define columns
  const columns = [
    { 
      key: 'item_code', 
      label: 'Item Code',
      sortable: true
    },
    { 
      key: 'item_name', 
      label: 'Item Name',
      sortable: true
    },
    { 
      key: 'category_name', 
      label: 'Category',
      sortable: true,
      render: (value) => value || '-'
    },
    { 
      key: 'unit_of_measure', 
      label: 'Unit',
      sortable: false
    },
    { 
      key: 'price', 
      label: 'Price',
      sortable: true,
      render: (value, row) => {
        const price = parseFloat(row.price || 0);
        return !isNaN(price) ? `₹${price.toFixed(2)}` : '₹0.00';
      }
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

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await categoryService.getCategories({ limit: 100 });
        console.log('Categories response:', response);
        const categoriesArray = response.data || response.categories || [];
        const activeCategories = categoriesArray.filter(cat => cat.is_active);
        setCategories(activeCategories);
        console.log('Active categories:', activeCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch items when debounced search changes
  useEffect(() => {
    console.log('Fetching items with search:', debouncedSearch);
    fetchData(1, pagination.limit, { search: debouncedSearch });
  }, [debouncedSearch]);

  // Initial fetch on mount
  useEffect(() => {
    console.log('Initial fetch on mount');
    fetchData(1, 10, { search: '' });
  }, []);

  const handleAdd = () => {
    setFormData({
      item_name: '',
      item_code: '',
      item_description: '',
      category_id: '',
      unit_of_measure: '',
      price: '',
      is_active: true
    });
    setSelectedItem(null);
    setAddModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      item_name: item.item_name || '',
      item_code: item.item_code || '',
      item_description: item.item_description || '',
      category_id: item.category_id ? item.category_id.toString() : '',
      unit_of_measure: item.unit_of_measure || '',
      price: item.price ? item.price.toString() : '',
      is_active: item.is_active !== undefined ? item.is_active : true
    });
    setEditModalOpen(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      // Clean and format data before submission
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        // Skip empty values except for booleans
        if (value !== undefined && value !== null && (typeof value === 'boolean' || value.toString().trim() !== '')) {
          if (typeof value === 'string' && value.toLowerCase() !== 'nil') {
            acc[key] = value.trim();
          } else if (typeof value === 'boolean') {
            acc[key] = value;
          }
        }
        return acc;
      }, {});

      // Format price and category_id
      const submitData = {
        ...cleanedData,
        price: parseFloat(cleanedData.price || 0),
        category_id: parseInt(cleanedData.category_id)
      };

      console.log('Submitting item data:', submitData);

      if (selectedItem) {
        await itemService.updateItem(selectedItem.item_id, submitData);
        toast.success('Item updated successfully');
      } else {
        await itemService.createItem(submitData);
        toast.success('Item created successfully');
      }

      // Refresh items list
      console.log('Refreshing items list after submit');
      await fetchData(pagination.page, pagination.limit, { search: debouncedSearch });
      
      // Close modal and reset
      setAddModalOpen(false);
      setEditModalOpen(false);
      setSelectedItem(null);
      setFormData({
        item_name: '',
        item_code: '',
        item_description: '',
        category_id: '',
        unit_of_measure: '',
        price: '',
        is_active: true
      });
    } catch (error) {
      console.error('Error saving item:', error);
      
      // Show specific validation errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        error.response.data.errors.forEach(err => {
          toast.error(`${err.path}: ${err.msg}`);
        });
      } else {
        toast.error(error.response?.data?.error || 'Failed to save item');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setSubmitting(true);
      await itemService.deleteItem(selectedItem.item_id);
      toast.success('Item deleted successfully');

      // Refresh items list
      console.log('Refreshing items list after delete');
      await fetchData(pagination.page, pagination.limit, { search: debouncedSearch });
      
      // Close modal
      setDeleteModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(error.response?.data?.error || 'Failed to delete item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSort = (field, direction) => {
    console.log('Sorting by:', field, direction);
    fetchData(1, pagination.limit, { 
      search: debouncedSearch,
      sortBy: field,
      sortOrder: direction 
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Item Management</h1>
        <Button
          variant="primary"
          onClick={handleAdd}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Item
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <Card>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <Input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <div className="text-sm text-gray-600">
              {!loading && (
                <span>
                  Showing {itemsWithCategories.length} of {pagination.total} items
                </span>
              )}
            </div>
          </div>

          <Table
            columns={columns}
            data={itemsWithCategories}
            loading={loading || loadingCategories}
            sortable={true}
            onSort={handleSort}
            emptyMessage={search ? "No items found matching your search" : "No items available. Click 'Add New Item' to create one."}
          />

          {!loading && itemsWithCategories.length > 0 && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-4">
              <button
                onClick={previousPage}
                disabled={pagination.page === 1}
                className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={nextPage}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Add/Edit Item Modal */}
      <Modal
        isOpen={addModalOpen || editModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setEditModalOpen(false);
          setSelectedItem(null);
        }}
        title={selectedItem ? 'Edit Item' : 'Add New Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name *
            </label>
            <Input
              type="text"
              value={formData.item_name}
              onChange={(e) => setFormData({
                ...formData,
                item_name: e.target.value
              })}
              required
              placeholder="Enter item name"
            />
          </div>

          {!selectedItem && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Code
              </label>
              <Input
                type="text"
                value={formData.item_code}
                onChange={(e) => setFormData({
                  ...formData,
                  item_code: e.target.value
                })}
                placeholder="Leave blank for auto-generation"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={formData.category_id}
              onChange={(e) => setFormData({
                ...formData,
                category_id: e.target.value
              })}
              required
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </option>
              ))}
            </select>
            {categories.length === 0 && !loadingCategories && (
              <p className="text-sm text-red-600 mt-1">
                No categories available. Please create categories first.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit of Measure *
            </label>
            <Input
              type="text"
              value={formData.unit_of_measure}
              onChange={(e) => setFormData({
                ...formData,
                unit_of_measure: e.target.value
              })}
              required
              placeholder="e.g., kg, piece, liter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({
                ...formData,
                price: e.target.value
              })}
              required
              placeholder="Enter price"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              rows="3"
              placeholder="Enter item description (optional)"
              value={formData.item_description || ''}
              onChange={(e) => setFormData({
                ...formData,
                item_description: e.target.value
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
                setSelectedItem(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : (selectedItem ? 'Save Changes' : 'Add Item')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedItem(null);
        }}
        title="Delete Item"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedItem?.item_name}</strong>?
            {' '}This action will deactivate the item.
          </p>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedItem(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete Item'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ItemManagement;