import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/forms/Button';
import Input from '../../components/forms/Input';
import Modal from '../../components/ui/Modal';
import { PlusIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { itemService } from '../../services/item.service';
import stockRequestService from '../../services/stockRequest.service';
import toast from 'react-hot-toast';

const StockRequest = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [search, setSearch] = useState('');
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [storeId, setStoreId] = useState(null);

  const requestHistoryColumns = [
    {
      key: 'request_id',
      label: 'Request ID',
      render: (value) => `REQ-${value.toString().padStart(6, '0')}`
    },
    {
      key: 'request_date',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'StockRequestItems',
      label: 'Items',
      render: (value) => `${value?.length || 0} items`
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
          {value?.toUpperCase() || 'UNKNOWN'}
        </span>
      )
    },
    {
      key: 'Approver',
      label: 'Approved By',
      render: (value) => value?.username || '-'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewRequest(row)}
            className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
            title="View Details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          {row.status === 'pending' && (
            <button
              onClick={() => handleDeleteRequest(row.request_id)}
              className="text-red-600 hover:text-red-800 p-1 transition-colors"
              title="Delete Request"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  useEffect(() => {
    const userStoreId = user?.Store?.store_id;
    
    console.log('User Store ID:', userStoreId);
    console.log('Full User Object:', user);
    
    if (!userStoreId) {
      setRequestsLoading(false);
      toast.error('Store information not found');
      return;
    }
    
    setStoreId(userStoreId);
    fetchRequestHistory(userStoreId);
  }, [user]);

  useEffect(() => {
    if (requestModalOpen) {
      fetchItems();
    }
  }, [requestModalOpen]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await itemService.getItems({ page: 1, limit: 100 });
      console.log('Items response:', response);
      
      const itemsData = response.items || response.data || [];
      setItems(itemsData.filter(item => item.is_active));
    } catch (error) {
      console.error('Error fetching items:', error);
      console.error('Error response:', error.response);
      toast.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestHistory = async (storeIdParam) => {
    try {
      setRequestsLoading(true);
      console.log('Fetching requests for store:', storeIdParam);
      
      const response = await stockRequestService.getMyStoreRequests({
        page: 1,
        limit: 50
      });
      
      console.log('Raw requests response:', response);
      
      // Handle different response formats
      let requestsData = [];
      
      if (response.requests && Array.isArray(response.requests)) {
        requestsData = response.requests;
      } else if (response.data && Array.isArray(response.data)) {
        requestsData = response.data;
      } else if (Array.isArray(response)) {
        requestsData = response;
      }
      
      console.log('Processed requests data:', requestsData);
      console.log('Requests count:', requestsData.length);
      
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching request history:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      // Don't show error toast if it's just empty data
      if (error.response?.status !== 404) {
        toast.error(error.response?.data?.error || 'Failed to fetch request history');
      }
      setRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleAddItem = (item) => {
    if (selectedItems.find(si => si.item_id === item.item_id)) {
      toast.error('Item already added');
      return;
    }

    setSelectedItems([...selectedItems, {
      item_id: item.item_id,
      item_name: item.item_name,
      item_code: item.item_code,
      unit_of_measure: item.unit_of_measure,
      quantity: 1,
      notes: ''
    }]);
  };

  const handleRemoveItem = (itemId) => {
    setSelectedItems(selectedItems.filter(item => item.item_id !== itemId));
  };

  const handleQuantityChange = (itemId, quantity) => {
    setSelectedItems(selectedItems.map(item =>
      item.item_id === itemId
        ? { ...item, quantity: parseFloat(quantity) || 0 }
        : item
    ));
  };

  const handleItemNotesChange = (itemId, notes) => {
    setSelectedItems(selectedItems.map(item =>
      item.item_id === itemId
        ? { ...item, notes }
        : item
    ));
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    if (!storeId) {
      toast.error('Store ID not found');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    if (selectedItems.some(item => item.quantity <= 0)) {
      toast.error('Please enter valid quantities for all items');
      return;
    }

    try {
      setSubmitting(true);

      console.log('Submitting stock request:', {
        store_id: storeId,
        items: selectedItems,
        notes: notes
      });

      await stockRequestService.createStockRequest({
        store_id: storeId,
        items: selectedItems,
        notes: notes
      });

      toast.success('Stock request submitted successfully');
      setRequestModalOpen(false);
      setSelectedItems([]);
      setNotes('');
      setSearch('');
      
      // Add delay before refreshing
      setTimeout(() => {
        fetchRequestHistory(storeId);
      }, 500);
      
    } catch (error) {
      console.error('Error submitting request:', error);
      console.error('Error response:', error.response);
      
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        error.response.data.errors.forEach(err => {
          toast.error(`${err.path}: ${err.msg}`);
        });
      } else {
        toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to submit request');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewRequest = (request) => {
    console.log('Viewing request:', request);
    setSelectedRequest(request);
    setViewModalOpen(true);
  };

  const handleDeleteRequest = async (requestId) => {
    if (!confirm('Are you sure you want to delete this request?')) {
      return;
    }

    try {
      await stockRequestService.deleteStockRequest(requestId);
      toast.success('Request deleted successfully');
      
      setTimeout(() => {
        fetchRequestHistory(storeId);
      }, 500);
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error(error.response?.data?.error || 'Failed to delete request');
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'quoted':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredItems = items.filter(item =>
    item.item_name.toLowerCase().includes(search.toLowerCase()) ||
    item.item_code.toLowerCase().includes(search.toLowerCase())
  );

  if (!storeId && !requestsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-500 mb-4">Store Information Not Found</h2>
          <p className="text-gray-600 mb-4">Please complete your store setup first</p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/store/setup'}
          >
            Complete Store Setup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Requests</h1>
          <p className="text-sm text-gray-600 mt-1">
            Store: {user?.Store?.store_name || 'N/A'}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setRequestModalOpen(true)}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Request
        </Button>
      </div>

      {/* Request History */}
      <Card>
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Request History</h2>
          <Table
            columns={requestHistoryColumns}
            data={requests}
            loading={requestsLoading}
            sortable={true}
            emptyMessage="No requests found. Create your first stock request!"
          />
        </div>
      </Card>

      {/* Create Request Modal */}
      <Modal
        isOpen={requestModalOpen}
        onClose={() => {
          setRequestModalOpen(false);
          setSelectedItems([]);
          setNotes('');
          setSearch('');
        }}
        title="Create Stock Request"
        size="large"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-6">
          {/* Available Items */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Select Items</h3>
            <Input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-3"
            />
            <div className="max-h-64 overflow-y-auto border rounded-lg">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading items...</div>
              ) : filteredItems.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {search ? 'No items found matching your search' : 'No items available'}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredItems.map(item => (
                    <div
                      key={item.item_id}
                      className="p-3 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.item_name}</p>
                        <p className="text-sm text-gray-500">
                          {item.item_code} • {item.unit_of_measure}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAddItem(item)}
                        disabled={selectedItems.some(si => si.item_id === item.item_id)}
                      >
                        {selectedItems.some(si => si.item_id === item.item_id) ? 'Added' : 'Add'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Selected Items ({selectedItems.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedItems.map(item => (
                  <div key={item.item_id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.item_name}</p>
                        <p className="text-sm text-gray-500">{item.item_code}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.item_id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove"
                      >
                        <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity ({item.unit_of_measure})
                        </label>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.item_id, e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes (Optional)
                        </label>
                        <Input
                          type="text"
                          value={item.notes}
                          onChange={(e) => handleItemNotesChange(item.item_id, e.target.value)}
                          placeholder="Add notes for this item"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Request Notes (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes for this request..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setRequestModalOpen(false);
                setSelectedItems([]);
                setNotes('');
                setSearch('');
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || selectedItems.length === 0}
            >
              {submitting ? 'Submitting...' : `Submit Request (${selectedItems.length} items)`}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Request Details Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedRequest(null);
        }}
        title="Request Details"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Request ID</label>
                <p className="mt-1 font-semibold">
                  REQ-{selectedRequest.request_id.toString().padStart(6, '0')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Date</label>
                <p className="mt-1">{new Date(selectedRequest.request_date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </p>
              </div>
              {selectedRequest.Approver && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Approved By</label>
                  <p className="mt-1">{selectedRequest.Approver.username}</p>
                </div>
              )}
            </div>

            {selectedRequest.notes && (
              <div>
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <p className="mt-1 text-gray-600">{selectedRequest.notes}</p>
              </div>
            )}

            {selectedRequest.approval_notes && (
              <div>
                <label className="text-sm font-medium text-gray-700">Admin Notes</label>
                <p className="mt-1 text-gray-600">{selectedRequest.approval_notes}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Requested Items</label>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Requested</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Approved</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedRequest.StockRequestItems && selectedRequest.StockRequestItems.length > 0 ? (
                      selectedRequest.StockRequestItems.map(item => (
                        <tr key={item.request_item_id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.Item?.item_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{item.Item?.item_code || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {item.quantity_requested} {item.Item?.unit_of_measure || ''}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {item.quantity_approved > 0 ? `${item.quantity_approved} ${item.Item?.unit_of_measure || ''}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                              {item.status?.toUpperCase() || 'UNKNOWN'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-3 text-sm text-gray-500 text-center">
                          No items found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setViewModalOpen(false);
                  setSelectedRequest(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StockRequest;