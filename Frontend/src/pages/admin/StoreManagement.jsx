import { useState, useEffect } from 'react';
import { usePaginatedApi } from '../../hooks/useApi';
import storeService from '../../services/store.service';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/forms/Button';
import Input from '../../components/forms/Input';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const StoreManagement = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Modal states
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    store_name: '',
    owner_name: '',
    phone_primary: '',
    email_primary: '',
    is_active: true
  });

  // Use paginated API hook for stores
  const {
    data: stores = [],
    pagination = { page: 1, limit: 10, total: 0, totalPages: 0 },
    loading,
    error,
    fetchData: fetchStores,
    goToPage,
    nextPage,
    previousPage,
  } = usePaginatedApi(storeService.getStores, 1, 10);

  const columns = [
    { 
      key: 'store_code', 
      label: 'Store Code',
      sortable: true
    },
    { 
      key: 'store_name', 
      label: 'Store Name',
      sortable: true
    },
    { 
      key: 'owner_name', 
      label: 'Owner',
      sortable: true
    },
    { 
      key: 'phone_primary', 
      label: 'Contact',
      sortable: false
    },
    { 
      key: 'email_primary', 
      label: 'Email',
      sortable: false
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
            onClick={() => handleViewStock(row.store_id)}
            className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
            title="View Stock"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
            title="Edit"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const stockColumns = [
    { key: 'item_code', label: 'Item Code' },
    { key: 'item_name', label: 'Item Name' },
    { 
      key: 'current_stock', 
      label: 'Current Stock',
      render: (value) => value || 0
    },
    { 
      key: 'reserved_stock', 
      label: 'Reserved Stock',
      render: (value) => value || 0
    },
    { 
      key: 'available_stock', 
      label: 'Available Stock',
      render: (value) => value || 0
    }
  ];

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch stores when search changes
  useEffect(() => {
    console.log('Fetching stores with search:', debouncedSearch);
    fetchStores(1, pagination.limit, { search: debouncedSearch });
  }, [debouncedSearch]);

  // Initial fetch
  useEffect(() => {
    console.log('Initial stores fetch');
    fetchStores(1, 10, { search: '' });
  }, []);

  const handleViewStock = async (storeId) => {
    try {
      setStockLoading(true);
      setSelectedStore(stores.find(store => store.store_id === storeId));
      setStockModalOpen(true);
      
      const response = await storeService.getStoreStock(storeId, { page: 1, limit: 100 });
      console.log('Stock response:', response);
      
      setStockData(response.stock || response.data || []);
    } catch (error) {
      console.error('Error fetching stock:', error);
      toast.error('Failed to fetch stock data');
      setStockData([]);
    } finally {
      setStockLoading(false);
    }
  };

  const handleEdit = (store) => {
    setSelectedStore(store);
    setEditFormData({
      store_name: store.store_name || '',
      owner_name: store.owner_name || '',
      phone_primary: store.phone_primary || '',
      email_primary: store.email_primary || '',
      is_active: store.is_active !== undefined ? store.is_active : true
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      // Clean up data
      const cleanedData = Object.entries(editFormData).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value.toString().trim() !== '') {
          acc[key] = typeof value === 'string' ? value.trim() : value;
        }
        return acc;
      }, {});

      await storeService.updateStore(selectedStore.store_id, cleanedData);
      toast.success('Store updated successfully');
      
      // Refresh the stores list
      await fetchStores(pagination.page, pagination.limit, { search: debouncedSearch });
      
      setEditModalOpen(false);
      setSelectedStore(null);
    } catch (error) {
      console.error('Error updating store:', error);
      
      // Show specific validation errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        error.response.data.errors.forEach(err => {
          toast.error(`${err.path}: ${err.msg}`);
        });
      } else {
        toast.error(error.response?.data?.error || 'Failed to update store');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSort = (field, direction) => {
    console.log('Sorting by:', field, direction);
    fetchStores(1, pagination.limit, { 
      search: debouncedSearch,
      sortBy: field,
      sortOrder: direction 
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Store Management</h1>
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
              placeholder="Search stores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <div className="text-sm text-gray-600">
              {!loading && (
                <span>
                  Showing {stores.length} of {pagination.total} stores
                </span>
              )}
            </div>
          </div>

          <Table
            columns={columns}
            data={stores}
            loading={loading}
            sortable={true}
            onSort={handleSort}
            emptyMessage={search ? "No stores found matching your search" : "No stores available"}
          />

          {!loading && stores.length > 0 && pagination.totalPages > 1 && (
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

      {/* Stock View Modal */}
      <Modal
        isOpen={stockModalOpen}
        onClose={() => {
          setStockModalOpen(false);
          setSelectedStore(null);
          setStockData([]);
        }}
        title={`Stock Details - ${selectedStore?.store_name || ''}`}
      >
        {stockLoading ? (
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner />
          </div>
        ) : (
          <Table
            columns={stockColumns}
            data={stockData}
            loading={false}
            emptyMessage="No stock data available"
          />
        )}
      </Modal>

      {/* Edit Store Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedStore(null);
        }}
        title="Edit Store"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Store Name *"
            value={editFormData.store_name}
            onChange={(e) => setEditFormData({
              ...editFormData,
              store_name: e.target.value
            })}
            required
            placeholder="Enter store name"
          />
          <Input
            label="Owner Name *"
            value={editFormData.owner_name}
            onChange={(e) => setEditFormData({
              ...editFormData,
              owner_name: e.target.value
            })}
            required
            placeholder="Enter owner name"
          />
          <Input
            label="Primary Phone *"
            value={editFormData.phone_primary}
            onChange={(e) => setEditFormData({
              ...editFormData,
              phone_primary: e.target.value
            })}
            required
            placeholder="9876543210"
          />
          <Input
            label="Primary Email *"
            type="email"
            value={editFormData.email_primary}
            onChange={(e) => setEditFormData({
              ...editFormData,
              email_primary: e.target.value
            })}
            required
            placeholder="store@example.com"
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={editFormData.is_active}
              onChange={(e) => setEditFormData({
                ...editFormData,
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
                setEditModalOpen(false);
                setSelectedStore(null);
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
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StoreManagement;