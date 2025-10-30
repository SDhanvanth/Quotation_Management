import { useState, useEffect } from 'react';
import { usePaginatedApi } from '../../hooks/useApi';
import retailerService from '../../services/retailer.service';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/forms/Button';
import Input from '../../components/forms/Input';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const RetailerManagement = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Modal states
  const [quotationModalOpen, setQuotationModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState(null);
  const [quotationHistory, setQuotationHistory] = useState([]);
  const [quotationLoading, setQuotationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    retailer_name: '',
    owner_name: '',
    phone_primary: '',
    email_primary: '',
    is_active: true
  });

  // Use paginated API hook
  const {
    data: retailers = [],
    pagination = { page: 1, limit: 10, total: 0, totalPages: 0 },
    loading,
    error,
    fetchData: fetchRetailers,
    goToPage,
    nextPage,
    previousPage,
  } = usePaginatedApi(retailerService.getRetailersAdmin, 1, 10);

  const columns = [
    { 
      key: 'retailer_code', 
      label: 'Retailer Code',
      sortable: true
    },
    { 
      key: 'retailer_name', 
      label: 'Retailer Name',
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
            onClick={() => handleViewQuotations(row.retailer_id)}
            className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
            title="View Quotations"
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

  const quotationColumns = [
    { key: 'quotation_number', label: 'Quotation ID' },
    { 
      key: 'submitted_on', 
      label: 'Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    },
    { 
      key: 'total_amount', 
      label: 'Total Amount',
      render: (value) => `₹${parseFloat(value || 0).toFixed(2)}`
    },
    { key: 'status', label: 'Status' }
  ];

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch retailers when search changes
  useEffect(() => {
    console.log('Fetching retailers with search:', debouncedSearch);
    fetchRetailers(1, pagination.limit, { search: debouncedSearch });
  }, [debouncedSearch]);

  // Initial fetch
  useEffect(() => {
    console.log('Initial retailers fetch');
    fetchRetailers(1, 10, { search: '' });
  }, []);

  const handleViewQuotations = async (retailerId) => {
    try {
      setQuotationLoading(true);
      const response = await retailerService.getRetailerQuotationsAdmin(retailerId);
      
      setQuotationHistory(response.quotations || []);
      setSelectedRetailer(retailers.find(retailer => retailer.retailer_id === retailerId));
      setQuotationModalOpen(true);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast.error('Failed to fetch quotation history');
    } finally {
      setQuotationLoading(false);
    }
  };

  const handleEdit = (retailer) => {
    setSelectedRetailer(retailer);
    setEditFormData({
      retailer_name: retailer.retailer_name || '',
      owner_name: retailer.owner_name || '',
      phone_primary: retailer.phone_primary || '',
      email_primary: retailer.email_primary || '',
      is_active: retailer.is_active !== undefined ? retailer.is_active : true
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

      await retailerService.updateRetailerAdmin(selectedRetailer.retailer_id, cleanedData);
      toast.success('Retailer updated successfully');

      // Refresh retailers list
      await fetchRetailers(pagination.page, pagination.limit, { search: debouncedSearch });
      
      setEditModalOpen(false);
      setSelectedRetailer(null);
    } catch (error) {
      console.error('Error updating retailer:', error);
      
      // Show specific validation errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        error.response.data.errors.forEach(err => {
          toast.error(`${err.path}: ${err.msg}`);
        });
      } else {
        toast.error(error.response?.data?.error || 'Failed to update retailer');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSort = (field, direction) => {
    console.log('Sorting by:', field, direction);
    fetchRetailers(1, pagination.limit, { 
      search: debouncedSearch,
      sortBy: field,
      sortOrder: direction 
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Retailer Management</h1>
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
              placeholder="Search retailers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <div className="text-sm text-gray-600">
              {!loading && (
                <span>
                  Showing {retailers.length} of {pagination.total} retailers
                </span>
              )}
            </div>
          </div>

          <Table
            columns={columns}
            data={retailers}
            loading={loading}
            sortable={true}
            onSort={handleSort}
            emptyMessage={search ? "No retailers found matching your search" : "No retailers available"}
          />

          {!loading && retailers.length > 0 && pagination.totalPages > 1 && (
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

      {/* Quotation History Modal */}
      <Modal
        isOpen={quotationModalOpen}
        onClose={() => {
          setQuotationModalOpen(false);
          setSelectedRetailer(null);
          setQuotationHistory([]);
        }}
        title={`Quotation History - ${selectedRetailer?.retailer_name || ''}`}
      >
        {quotationLoading ? (
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner />
          </div>
        ) : (
          <Table
            columns={quotationColumns}
            data={quotationHistory}
            loading={false}
            emptyMessage="No quotation history available"
          />
        )}
      </Modal>

      {/* Edit Retailer Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedRetailer(null);
        }}
        title="Edit Retailer"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Retailer Name *"
            value={editFormData.retailer_name}
            onChange={(e) => setEditFormData({
              ...editFormData,
              retailer_name: e.target.value
            })}
            required
            placeholder="Enter retailer name"
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
            placeholder="retailer@example.com"
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
                setSelectedRetailer(null);
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

export default RetailerManagement;