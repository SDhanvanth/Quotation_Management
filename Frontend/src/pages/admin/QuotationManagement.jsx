// src/pages/admin/QuotationManagement.jsx (COMPLETE UPDATED FILE WITH CLOSE QUOTATION FEATURE)
import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/forms/Button';
import Input from '../../components/forms/Input';
import Modal from '../../components/ui/Modal';
import { 
  PlusIcon, 
  DocumentTextIcon,
  EyeIcon,
  CubeIcon,
  TrophyIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import quotationService from '../../services/quotation.service';
import stockRequestService from '../../services/stockRequest.service';
import toast from 'react-hot-toast';

const QuotationManagement = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modals
  const [viewRequestsModalOpen, setViewRequestsModalOpen] = useState(false);
  const [createQuotationModalOpen, setCreateQuotationModalOpen] = useState(false);
  const [viewQuotationModalOpen, setViewQuotationModalOpen] = useState(false);
  const [viewResponsesModalOpen, setViewResponsesModalOpen] = useState(false);
  const [awardModalOpen, setAwardModalOpen] = useState(false);
  const [closeQuotationModalOpen, setCloseQuotationModalOpen] = useState(false); // NEW
  
  // Data
  const [groupedItems, setGroupedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [retailerResponses, setRetailerResponses] = useState([]);
  const [stockRequestLoading, setStockRequestLoading] = useState(false);
  const [quotationToClose, setQuotationToClose] = useState(null); // NEW
  
  // Award state
  const [awardComparisonData, setAwardComparisonData] = useState(null);
  const [awardSelections, setAwardSelections] = useState({});
  const [awardLoading, setAwardLoading] = useState(false);
  
  // Form
  const [quotationFormData, setQuotationFormData] = useState({
    validity_until: '',
    notes: ''
  });

  // Table Columns - Quotations (UPDATED WITH CLOSE BUTTON)
  const quotationColumns = [
    { 
      key: 'quotation_number', 
      label: 'Quotation #',
      sortable: true
    },
    { 
      key: 'quotation_name', 
      label: 'Name',
      sortable: true
    },
    { 
      key: 'created_on', 
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    { 
      key: 'validity_until', 
      label: 'Deadline',
      sortable: true,
      render: (value, row) => {
        const isExpired = new Date() > new Date(value);
        const isClosed = row.QuotationStatus?.status_name === 'closed';
        return (
          <span className={isExpired || isClosed ? 'text-red-600 font-medium' : ''}>
            {new Date(value).toLocaleDateString()}
            {isExpired && !isClosed && ' (Expired)'}
            {isClosed && ' (Closed Early)'}
          </span>
        );
      }
    },
    { 
      key: 'QuotationStatus.status_name', 
      label: 'Status',
      sortable: true,
      render: (value, row) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(row.QuotationStatus?.status_name)}`}>
          {row.QuotationStatus?.status_name || 'N/A'}
        </span>
      )
    },
    { 
      key: 'response_count', 
      label: 'Responses',
      render: (value, row) => {
        const count = row.RetailerQuotations?.filter(r => r.status === 'submitted').length || 0;
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {count} response{count !== 1 ? 's' : ''}
          </span>
        );
      }
    },
    { 
      key: 'actions', 
      label: 'Actions',
      render: (value, row) => {
        const isExpired = new Date() > new Date(row.validity_until);
        const hasResponses = row.RetailerQuotations?.some(r => r.status === 'submitted');
        const statusName = row.QuotationStatus?.status_name;
        const isAwarded = statusName === 'awarded';
        const isClosed = statusName === 'closed';
        const isPublished = statusName === 'published';
        
        // Can award if: (expired OR closed) AND has responses AND not awarded
        const canAward = (isExpired || isClosed) && hasResponses && !isAwarded;
        
        // Can close if: published AND not expired AND not awarded AND not already closed
        const canClose = isPublished && !isExpired && !isAwarded && !isClosed;
        
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleViewQuotation(row)}
              className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
              title="View Details"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleViewResponses(row)}
              className="text-green-600 hover:text-green-800 p-1 transition-colors"
              title="View Responses"
            >
              <DocumentTextIcon className="h-5 w-5" />
            </button>
            
            {/* Close Button - appears for active quotations with responses */}
            {canClose && hasResponses && (
              <button
                onClick={() => handleCloseQuotation(row)}
                className="text-orange-600 hover:text-orange-800 p-1 transition-colors"
                title="Close Quotation Early"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            )}
            
            {/* Award Button */}
            {canAward && (
              <button
                onClick={() => handleOpenAwardModal(row)}
                className="text-yellow-600 hover:text-yellow-800 p-1 transition-colors"
                title={isClosed ? "Award Quotation (Closed Early)" : "Award Quotation"}
              >
                <TrophyIcon className="h-5 w-5" />
              </button>
            )}
            
            {/* Already Awarded Indicator */}
            {isAwarded && (
              <span className="text-green-600 p-1" title="Already Awarded">
                <CheckCircleIcon className="h-5 w-5" />
              </span>
            )}
          </div>
        );
      }
    }
  ];

  // Table Columns - Stock Requests (NO CHANGES)
  const stockRequestColumns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectedItems.length === groupedItems.flatMap(item => item.request_item_ids).length && groupedItems.length > 0}
          onChange={(e) => handleSelectAllItems(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      render: (value, row) => (
        <input
          type="checkbox"
          checked={row.request_item_ids.every(id => selectedItems.includes(id))}
          onChange={(e) => handleItemSelection(row, e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      )
    },
    {
      key: 'item_name',
      label: 'Item',
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{row.item_code}</p>
        </div>
      )
    },
    {
      key: 'total_quantity',
      label: 'Total Quantity',
      render: (value, row) => (
        <span className="font-medium">
          {parseFloat(value).toFixed(2)} {row.unit_of_measure}
        </span>
      )
    },
    {
      key: 'total_stores',
      label: 'Stores',
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {value} store{value !== 1 ? 's' : ''}
        </span>
      )
    },
    {
      key: 'stores',
      label: 'Store Details',
      render: (stores) => (
        <div className="text-sm text-gray-600 space-y-1">
          {stores.slice(0, 2).map(store => (
            <div key={store.store_id}>
              <span className="font-medium">{store.store_name}:</span> {parseFloat(store.quantity).toFixed(2)}
            </div>
          ))}
          {stores.length > 2 && (
            <div className="text-xs text-blue-600">+{stores.length - 2} more</div>
          )}
        </div>
      )
    }
  ];

  // Load quotations on mount and when filters change
  useEffect(() => {
    fetchQuotations();
  }, [page, search]);

  // Fetch quotations
  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await quotationService.getQuotations({
        page,
        limit: 10,
        search
      });
      setQuotations(response.quotations);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast.error('Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch grouped stock requests
  const fetchGroupedStockRequests = async () => {
    try {
      setStockRequestLoading(true);
      const response = await stockRequestService.getGroupedRequestsByItem({
        status: 'pending'
      });
      
      const transformedItems = response.items.map(item => ({
        ...item,
        request_item_ids: item.stores.map(store => store.request_item_id)
      }));
      
      setGroupedItems(transformedItems);
    } catch (error) {
      console.error('Error fetching grouped stock requests:', error);
      toast.error('Failed to fetch stock requests');
    } finally {
      setStockRequestLoading(false);
    }
  };

  // Handle view requests
  const handleViewRequests = () => {
    setViewRequestsModalOpen(true);
    fetchGroupedStockRequests();
  };

  // Handle item selection
  const handleItemSelection = (row, selected) => {
    if (selected) {
      setSelectedItems([...selectedItems, ...row.request_item_ids]);
    } else {
      setSelectedItems(selectedItems.filter(id => !row.request_item_ids.includes(id)));
    }
  };

  // Handle select all items
  const handleSelectAllItems = (selected) => {
    if (selected) {
      const allIds = groupedItems.flatMap(item => item.request_item_ids);
      setSelectedItems(allIds);
    } else {
      setSelectedItems([]);
    }
  };

  // Handle create quotation
  const handleCreateQuotation = () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item');
      return;
    }
    setViewRequestsModalOpen(false);
    setCreateQuotationModalOpen(true);
  };

  // Handle submit quotation
  const handleSubmitQuotation = async (e) => {
    e.preventDefault();

    if (!quotationFormData.validity_until) {
      toast.error('Please select a deadline');
      return;
    }

    try {
      await quotationService.createQuotationFromStockRequests({
        request_item_ids: selectedItems,
        validity_until: quotationFormData.validity_until,
        notes: quotationFormData.notes
      });

      toast.success('Quotation created successfully!');
      
      setCreateQuotationModalOpen(false);
      setSelectedItems([]);
      setQuotationFormData({
        validity_until: '',
        notes: ''
      });
      
      fetchQuotations();
    } catch (error) {
      console.error('Error creating quotation:', error);
      toast.error(error.response?.data?.error || 'Failed to create quotation');
    }
  };

  // Handle view quotation
  const handleViewQuotation = async (quotation) => {
    try {
      const response = await quotationService.getQuotationById(quotation.quotation_id);
      setSelectedQuotation(response);
      setViewQuotationModalOpen(true);
    } catch (error) {
      console.error('Error fetching quotation details:', error);
      toast.error('Failed to fetch quotation details');
    }
  };

  // Handle view responses
  const handleViewResponses = async (quotation) => {
    try {
      const response = await quotationService.getRetailerResponses(quotation.quotation_id);
      
      let responsesArray = [];
      if (Array.isArray(response)) {
        responsesArray = response;
      } else if (response?.responses && Array.isArray(response.responses)) {
        responsesArray = response.responses;
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          responsesArray = response.data;
        } else if (response.data.responses && Array.isArray(response.data.responses)) {
          responsesArray = response.data.responses;
        }
      }
      
      responsesArray = responsesArray.filter(r => r && r.retailer_quotation_id);
      
      console.log('Processed Retailer Responses:', responsesArray);
      setRetailerResponses(responsesArray);
      setSelectedQuotation(quotation);
      setViewResponsesModalOpen(true);
    } catch (error) {
      console.error('Error fetching retailer responses:', error);
      setRetailerResponses([]);
      toast.error(error.response?.data?.error || 'Failed to fetch retailer responses');
    }
  };

  // NEW: Handle close quotation
  const handleCloseQuotation = (quotation) => {
    setQuotationToClose(quotation);
    setCloseQuotationModalOpen(true);
  };

  // NEW: Handle confirm close quotation
  const handleConfirmCloseQuotation = async () => {
    try {
      setAwardLoading(true);
      
      await quotationService.updateQuotationStatus(
        quotationToClose.quotation_id,
        'closed'
      );
      
      toast.success('Quotation closed successfully! You can now proceed to award.');
      
      setCloseQuotationModalOpen(false);
      setQuotationToClose(null);
      
      fetchQuotations();
    } catch (error) {
      console.error('Error closing quotation:', error);
      toast.error(error.response?.data?.error || 'Failed to close quotation');
    } finally {
      setAwardLoading(false);
    }
  };

  // Handle open award modal (ENHANCED)
  const handleOpenAwardModal = async (quotation) => {
    try {
      setAwardLoading(true);
      const response = await quotationService.getAwardComparison(quotation.quotation_id);
      
      if (!response || !response.data || !response.data.items) {
        throw new Error('Invalid award comparison data received');
      }
      
      setAwardComparisonData(response.data);
      setSelectedQuotation(quotation);
      
      // Auto-select lowest prices or already awarded items
      const autoSelections = {};
      response.data.items.forEach(item => {
        if (item.already_awarded) {
          autoSelections[item.quotation_item_id] = item.already_awarded.retailer_quotation_item_id;
        } else if (item.lowest_price && !item.already_awarded) {
          autoSelections[item.quotation_item_id] = item.lowest_price.retailer_quotation_item_id;
        }
      });
      
      setAwardSelections(autoSelections);
      setAwardModalOpen(true);
    } catch (error) {
      console.error('Error fetching award comparison:', error);
      toast.error(error.response?.data?.error || 'Failed to load award data');
    } finally {
      setAwardLoading(false);
    }
  };

  // Handle award selection change
  const handleAwardSelectionChange = (quotationItemId, retailerQuotationItemId) => {
    setAwardSelections(prev => ({
      ...prev,
      [quotationItemId]: retailerQuotationItemId
    }));
  };

  // Handle submit award (ENHANCED WITH VALIDATION)
  const handleSubmitAward = async () => {
    try {
      const selectedCount = Object.keys(awardSelections).length;
      const availableCount = awardComparisonData.items.filter(i => 
        i.response_count > 0 && !i.already_awarded
      ).length;

      if (selectedCount === 0) {
        toast.error('Please select at least one item to award');
        return;
      }

      // Confirm if not all items are selected
      if (selectedCount < availableCount) {
        const confirmed = window.confirm(
          `You have selected ${selectedCount} out of ${availableCount} available items.\n\n` +
          `Do you want to proceed with partial award?`
        );
        if (!confirmed) return;
      }

      const awards = Object.entries(awardSelections).map(([quotationItemId, retailerQuotationItemId]) => ({
        quotation_item_id: parseInt(quotationItemId),
        retailer_quotation_item_id: parseInt(retailerQuotationItemId)
      }));

      setAwardLoading(true);
      
      await quotationService.awardQuotation(selectedQuotation.quotation_id, awards);
      
      toast.success(
        `Successfully awarded ${awards.length} item(s) worth ₹${calculateTotalAwardValue().toLocaleString('en-IN')}!`,
        { duration: 5000 }
      );
      
      setAwardModalOpen(false);
      setAwardComparisonData(null);
      setAwardSelections({});
      setSelectedQuotation(null);
      
      fetchQuotations();
    } catch (error) {
      console.error('Error awarding quotation:', error);
      toast.error(error.response?.data?.error || 'Failed to award quotation');
    } finally {
      setAwardLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'published':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-orange-100 text-orange-800';
      case 'awarded':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get selected items summary
  const getSelectedItemsSummary = () => {
    const selectedGroupedItems = groupedItems.filter(item => 
      item.request_item_ids.some(id => selectedItems.includes(id))
    );
    
    return {
      itemCount: selectedGroupedItems.length,
      totalQuantity: selectedGroupedItems.reduce((sum, item) => sum + parseFloat(item.total_quantity), 0),
      storeCount: new Set(selectedGroupedItems.flatMap(item => item.stores.map(s => s.store_id))).size
    };
  };

  // Calculate total award value
  const calculateTotalAwardValue = () => {
    if (!awardComparisonData) return 0;
    
    let total = 0;
    Object.entries(awardSelections).forEach(([quotationItemId, retailerQuotationItemId]) => {
      const item = awardComparisonData.items.find(i => i.quotation_item_id === parseInt(quotationItemId));
      if (item) {
        const selectedPrice = item.retailer_prices.find(p => p.retailer_quotation_item_id === retailerQuotationItemId);
        if (selectedPrice) {
          total += selectedPrice.total_amount;
        }
      }
    });
    return total;
  };

  // Get unique retailers count
  const getUniqueRetailersCount = () => {
    if (!awardComparisonData) return 0;
    
    const retailerIds = new Set();
    Object.entries(awardSelections).forEach(([quotationItemId, retailerQuotationItemId]) => {
      const item = awardComparisonData.items.find(i => i.quotation_item_id === parseInt(quotationItemId));
      if (item) {
        const selectedPrice = item.retailer_prices.find(p => p.retailer_quotation_item_id === retailerQuotationItemId);
        if (selectedPrice) {
          retailerIds.add(selectedPrice.retailer_id);
        }
      }
    });
    return retailerIds.size;
  };

  // NEW: Helper function for safe nested value extraction
  const getNestedValue = (obj, path, defaultValue = 'N/A') => {
    return path.split('.').reduce((current, prop) => 
      current?.[prop], obj) || defaultValue;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Quotation Management</h1>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={handleViewRequests}
            className="flex items-center"
          >
            <CubeIcon className="h-5 w-5 mr-2" />
            View Requests
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (selectedItems.length === 0) {
                toast.error('Please select items from stock requests first');
                handleViewRequests();
              } else {
                setCreateQuotationModalOpen(true);
              }
            }}
            className="flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Quotation
          </Button>
        </div>
      </div>

      {/* Quotations List */}
      <Card>
        <div className="p-4">
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search quotations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
          </div>

          <Table
            columns={quotationColumns}
            data={quotations}
            loading={loading}
            emptyMessage="No quotations found"
          />

          {!loading && quotations.length > 0 && totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-4">
              <Button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                variant="secondary"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                variant="secondary"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* ==================== MODALS ==================== */}

      {/* 1. View Stock Requests Modal */}
      <Modal
        isOpen={viewRequestsModalOpen}
        onClose={() => {
          setViewRequestsModalOpen(false);
          setSelectedItems([]);
        }}
        title="Active Stock Requests"
        size="large"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> These are pending stock requests grouped by item. 
              Select items to create a quotation for retailers.
            </p>
          </div>

          {selectedItems.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Selection Summary</h4>
              <div className="text-sm text-green-800 space-y-1">
                <p>✓ {getSelectedItemsSummary().itemCount} unique items selected</p>
                <p>✓ Total quantity: {getSelectedItemsSummary().totalQuantity.toFixed(2)} units</p>
                <p>✓ From {getSelectedItemsSummary().storeCount} store(s)</p>
              </div>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <Table
              columns={stockRequestColumns}
              data={groupedItems}
              loading={stockRequestLoading}
              emptyMessage="No pending stock requests found"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setViewRequestsModalOpen(false);
                setSelectedItems([]);
              }}
            >
              Close
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleCreateQuotation}
              disabled={selectedItems.length === 0}
            >
              Create Quotation ({getSelectedItemsSummary().itemCount} items)
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2. Create Quotation Modal */}
      <Modal
        isOpen={createQuotationModalOpen}
        onClose={() => {
          setCreateQuotationModalOpen(false);
          setQuotationFormData({
            validity_until: '',
            notes: ''
          });
        }}
        title="Create Quotation"
      >
        <form onSubmit={handleSubmitQuotation} className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Selected Items Summary</h3>
            <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
              {groupedItems
                .filter(item => item.request_item_ids.some(id => selectedItems.includes(id)))
                .map((item, index) => (
                  <div key={index} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.item_name}</p>
                      <p className="text-gray-500 text-xs">{item.item_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {parseFloat(item.total_quantity).toFixed(2)} {item.unit_of_measure}
                      </p>
                      <p className="text-gray-500 text-xs">{item.total_stores} store(s)</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Deadline *"
              type="date"
              value={quotationFormData.validity_until}
              onChange={(e) => setQuotationFormData(prev => ({
                ...prev,
                validity_until: e.target.value
              }))}
              required
              min={new Date().toISOString().split('T')[0]}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                rows="4"
                value={quotationFormData.notes}
                onChange={(e) => setQuotationFormData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
                placeholder="Add any additional notes or requirements for this quotation..."
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Once created, this quotation will be published to all active retailers. 
              The selected stock request items will be marked as quoted.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setCreateQuotationModalOpen(false);
                setQuotationFormData({
                  validity_until: '',
                  notes: ''
                });
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Create & Publish Quotation
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. View Quotation Details Modal */}
      <Modal
        isOpen={viewQuotationModalOpen}
        onClose={() => {
          setViewQuotationModalOpen(false);
          setSelectedQuotation(null);
        }}
        title="Quotation Details"
        size="large"
      >
        {selectedQuotation && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Quotation Number</label>
                <p className="mt-1 text-gray-900 font-semibold">{selectedQuotation.quotation_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Quotation Name</label>
                <p className="mt-1 text-gray-900">{selectedQuotation.quotation_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Created On</label>
                <p className="mt-1 text-gray-900">
                  {new Date(selectedQuotation.created_on).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Deadline</label>
                <p className="mt-1 text-gray-900">
                  {new Date(selectedQuotation.validity_until).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedQuotation.QuotationStatus?.status_name)}`}>
                    {selectedQuotation.QuotationStatus?.status_name}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Created By</label>
                <p className="mt-1 text-gray-900">{selectedQuotation.quotationCreator?.username}</p>
              </div>
            </div>

            {selectedQuotation.notes && (
              <div>
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <p className="mt-1 text-gray-600">{selectedQuotation.notes}</p>
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Quotation Items</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specifications</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedQuotation.QuotationItems?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{item.Item?.item_name}</p>
                            <p className="text-sm text-gray-500">{item.Item?.item_code}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {parseFloat(item.requested_quantity).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-gray-900">{item.unit_of_measure}</td>
                        <td className="px-4 py-3 text-gray-600 text-sm">{item.specifications || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setViewQuotationModalOpen(false);
                  setSelectedQuotation(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 4. View Retailer Responses Modal - ENHANCED */}
      <Modal
  isOpen={viewResponsesModalOpen}
  onClose={() => {
    setViewResponsesModalOpen(false);
    setRetailerResponses([]);
    setSelectedQuotation(null);
  }}
  title={`Retailer Responses - ${selectedQuotation?.quotation_number || 'N/A'}`}
  size="large"
>
  <div className="space-y-4">
    {!retailerResponses || retailerResponses.length === 0 ? (
      <div className="text-center py-8">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-gray-500">No responses received yet</p>
        <p className="mt-1 text-sm text-gray-400">
          Retailers will submit their quotes before the deadline
        </p>
      </div>
    ) : (
      <div className="space-y-4">
        {/* Summary Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Total Responses:</span>
              <span className="ml-2 text-blue-900 font-semibold">{retailerResponses.length}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Total Value:</span>
              <span className="ml-2 text-blue-900 font-semibold">
                ₹{retailerResponses.reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0)
                  .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Lowest Bid:</span>
              <span className="ml-2 text-green-600 font-semibold">
                ₹{Math.min(...retailerResponses.map(r => parseFloat(r.total_amount || 0)))
                  .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {retailerResponses.map((response, index) => {
          // ✅ FIXED - Safe data extraction with better fallback logic
          console.log('Response structure:', response); // Debug log
          
          // Get retailer details from response
          const retailerDetails = response.RetailerDetails || response.RetailerDetail || {};
          const retailerUser = retailerDetails.User || {};
          
          // Extract retailer information with multiple fallback options
          const retailerName = 
            retailerDetails.retailer_name ||
            retailerDetails.company_name ||
            retailerUser.username ||
            'Unknown Retailer';
          
          const ownerName = 
            retailerDetails.owner_name ||
            retailerDetails.contact_person ||
            'N/A';
          
          const retailerEmail = 
            retailerDetails.email_primary ||
            retailerDetails.email ||
            retailerUser.email ||
            'N/A';
          
          const contactNumber = 
            retailerDetails.phone_primary ||
            retailerDetails.contact_number ||
            retailerDetails.phone ||
            'N/A';
          
          const retailerCode = 
            retailerDetails.retailer_code ||
            '';
          
          const gstNumber = 
            retailerDetails.gst_number ||
            retailerDetails.gstin ||
            '';

          const totalAmount = parseFloat(response.total_amount || 0);
          const isLowestBid = totalAmount === Math.min(...retailerResponses.map(r => parseFloat(r.total_amount || 0)));

          return (
            <Card key={response.retailer_quotation_id || index}>
              <div className="p-4">
                <div className="flex justify-between items-start mb-4 pb-3 border-b">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-lg text-gray-900">
                        {retailerName}
                      </h4>
                      {isLowestBid && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-600 text-white">
                          Lowest Bid
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Owner:</span> {ownerName}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {retailerEmail}
                      </p>
                      {contactNumber !== 'N/A' && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Phone:</span> {contactNumber}
                        </p>
                      )}
                      {retailerCode && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Code:</span> {retailerCode}
                        </p>
                      )}
                      {gstNumber && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">GST:</span> {gstNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted: {response.submitted_on 
                        ? new Date(response.submitted_on).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })
                        : 'N/A'}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium mt-2 ${
                      response.status === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {response.status || 'draft'}
                    </span>
                  </div>
                </div>

                {response.RetailerQuotationItems && response.RetailerQuotationItems.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {response.RetailerQuotationItems.map((item, idx) => {
                          const itemName = 
                            item.Item?.item_name ||
                            item.QuotationItem?.Item?.item_name ||
                            item.item_name ||
                            'N/A';
                          
                          const itemCode = 
                            item.Item?.item_code ||
                            item.QuotationItem?.Item?.item_code ||
                            item.item_code ||
                            'N/A';
                          
                          const unitOfMeasure = 
                            item.Item?.unit_of_measure ||
                            item.QuotationItem?.unit_of_measure ||
                            item.unit_of_measure ||
                            'Unit';
                          
                          const quantity = parseFloat(item.quantity || 0);
                          const unitPrice = parseFloat(item.unit_price || 0);
                          const itemTotal = quantity * unitPrice;

                          return (
                            <tr key={item.retailer_quotation_item_id || idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {itemName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Code: {itemCode}
                                  </p>
                                  {item.notes && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      Note: {item.notes}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                {quantity.toFixed(2)} {unitOfMeasure}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                ₹{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                                ₹{itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="3" className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                            Grand Total:
                          </td>
                          <td className="px-4 py-3 text-right text-lg font-bold text-green-600">
                            ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <DocumentTextIcon className="mx-auto h-10 w-10 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No items quoted</p>
                  </div>
                )}

                {response.notes && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <label className="text-xs font-medium text-yellow-700 uppercase">Retailer Notes</label>
                    <p className="text-sm text-gray-700 mt-1">{response.notes}</p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    )}

    <div className="flex justify-end space-x-2 pt-4 border-t">
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          setViewResponsesModalOpen(false);
          setRetailerResponses([]);
          setSelectedQuotation(null);
        }}
      >
        Close
      </Button>
      {retailerResponses.length > 0 && selectedQuotation && (
        <>
          {/* Show Close button if still active */}
          {selectedQuotation.QuotationStatus?.status_name === 'published' && 
           new Date() < new Date(selectedQuotation.validity_until) && (
            <Button
              type="button"
              variant="warning"
              onClick={() => {
                setViewResponsesModalOpen(false);
                handleCloseQuotation(selectedQuotation);
              }}
              className="flex items-center bg-orange-600 hover:bg-orange-700"
            >
              <XCircleIcon className="h-5 w-5 mr-2" />
              Close & Award
            </Button>
          )}
          
          {/* Show Award button if expired or closed */}
          {(new Date() > new Date(selectedQuotation.validity_until) || 
            selectedQuotation.QuotationStatus?.status_name === 'closed') && 
           selectedQuotation.QuotationStatus?.status_name !== 'awarded' && (
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setViewResponsesModalOpen(false);
                handleOpenAwardModal(selectedQuotation);
              }}
              className="flex items-center"
            >
              <TrophyIcon className="h-5 w-5 mr-2" />
              Proceed to Award
            </Button>
          )}
        </>
      )}
    </div>
  </div>
</Modal>

      {/* 5. NEW - Close Quotation Confirmation Modal */}
      <Modal
        isOpen={closeQuotationModalOpen}
        onClose={() => {
          setCloseQuotationModalOpen(false);
          setQuotationToClose(null);
        }}
        title="Close Quotation Early"
        size="small"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Warning:</strong> Closing this quotation before the deadline will:
            </p>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
              <li>Stop accepting new responses from retailers</li>
              <li>Allow you to award the quotation immediately</li>
              <li>Mark the quotation as "Closed Early"</li>
              <li>Prevent any further updates from retailers</li>
            </ul>
          </div>

          {quotationToClose && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Quotation Details</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Number:</span> {quotationToClose.quotation_number}</p>
                <p><span className="font-medium">Name:</span> {quotationToClose.quotation_name}</p>
                <p><span className="font-medium">Original Deadline:</span> {new Date(quotationToClose.validity_until).toLocaleDateString()}</p>
                <p>
                  <span className="font-medium">Responses:</span> 
                  <span className="ml-1 text-green-700 font-semibold">
                    {quotationToClose.RetailerQuotations?.filter(r => r.status === 'submitted').length || 0} submitted
                  </span>
                </p>
                <p><span className="font-medium">Days Remaining:</span> {Math.ceil((new Date(quotationToClose.validity_until) - new Date()) / (1000 * 60 * 60 * 24))} days</p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Make sure you have received enough responses before closing early. 
              You can view all responses before making this decision.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setCloseQuotationModalOpen(false);
                setQuotationToClose(null);
              }}
              disabled={awardLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleConfirmCloseQuotation}
              disabled={awardLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {awardLoading ? 'Closing...' : 'Close Quotation'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 6. Award Quotation Modal */}
      <Modal
        isOpen={awardModalOpen}
        onClose={() => {
          setAwardModalOpen(false);
          setAwardComparisonData(null);
          setAwardSelections({});
          setSelectedQuotation(null);
        }}
        title={`Award Quotation - ${selectedQuotation?.quotation_number}`}
        size="xlarge"
      >
        {awardLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500">Loading comparison data...</div>
          </div>
        ) : awardComparisonData ? (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Total Items:</span>
                  <span className="ml-2 text-blue-900 font-semibold">{awardComparisonData.total_items}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Items with Responses:</span>
                  <span className="ml-2 text-blue-900 font-semibold">{awardComparisonData.items_with_responses}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Already Awarded:</span>
                  <span className="ml-2 text-blue-900 font-semibold">{awardComparisonData.already_awarded_count}</span>
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Instructions:</strong> Review the prices from different retailers for each item. 
                The lowest price is highlighted and pre-selected. You can change the selection to award a different retailer.
              </p>
            </div>

            {/* Award Comparison Table */}
            <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retailer Prices</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Award To</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {awardComparisonData.items.map((item) => (
                    <tr key={item.quotation_item_id} className={item.already_awarded ? 'bg-green-50' : ''}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.item_name}</p>
                          <p className="text-xs text-gray-500">{item.item_code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {parseFloat(item.requested_quantity).toFixed(2)} {item.unit_of_measure}
                      </td>
                      <td className="px-4 py-3">
                        {item.retailer_prices.length === 0 ? (
                          <span className="text-sm text-gray-500 italic">No responses</span>
                        ) : (
                          <div className="space-y-2">
                            {item.retailer_prices.map((price, idx) => {
                              const isLowest = idx === 0;
                              const isSelected = awardSelections[item.quotation_item_id] === price.retailer_quotation_item_id;
                              
                              return (
                                <div
                                  key={price.retailer_quotation_item_id}
                                  className={`text-sm p-2 rounded ${
                                    isLowest ? 'bg-green-100 border border-green-300' : 
                                    isSelected ? 'bg-blue-100 border border-blue-300' : 
                                    'bg-gray-50'
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-900">{price.retailer_name}</span>
                                    <span className="font-bold text-gray-900">
                                      ₹{price.unit_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    Qty: {price.quantity} | Total: ₹{price.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </div>
                                  {isLowest && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-600 text-white mt-1">
                                      Lowest Price
                                    </span>
                                  )}
                                  {price.is_awarded && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-600 text-white mt-1">
                                      Already Awarded
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.retailer_prices.length === 0 ? (
                          <span className="text-sm text-gray-400">N/A</span>
                        ) : item.already_awarded ? (
                          <div className="text-sm">
                            <p className="font-medium text-green-700">{item.already_awarded.retailer_name}</p>
                            <p className="text-xs text-gray-600">Already awarded</p>
                          </div>
                        ) : (
                          <select
                            value={awardSelections[item.quotation_item_id] || ''}
                            onChange={(e) => handleAwardSelectionChange(item.quotation_item_id, parseInt(e.target.value))}
                            className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Select Retailer</option>
                            {item.retailer_prices.map((price) => (
                              <option key={price.retailer_quotation_item_id} value={price.retailer_quotation_item_id}>
                                {price.retailer_name} - ₹{price.unit_price.toFixed(2)}
                                {price === item.lowest_price ? ' (Lowest)' : ''}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Award Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Award Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Items to Award:</span>
                  <span className="font-semibold text-gray-900">
                    {Object.keys(awardSelections).length} of {awardComparisonData.items.filter(i => i.response_count > 0).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Total Estimated Value:</span>
                  <span className="font-bold text-green-600 text-lg">
                    ₹{calculateTotalAwardValue().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Unique Retailers Selected:</span>
                  <span className="font-semibold text-gray-900">
                    {getUniqueRetailersCount()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setAwardModalOpen(false);
                  setAwardComparisonData(null);
                  setAwardSelections({});
                  setSelectedQuotation(null);
                }}
                disabled={awardLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmitAward}
                disabled={awardLoading || Object.keys(awardSelections).length === 0}
                className="flex items-center"
              >
                <TrophyIcon className="h-5 w-5 mr-2" />
                {awardLoading ? 'Awarding...' : `Award ${Object.keys(awardSelections).length} Item(s)`}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No award data available</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default QuotationManagement;