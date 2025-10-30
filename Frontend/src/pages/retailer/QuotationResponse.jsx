// src/pages/retailer/QuotationResponse.jsx (COMPLETE CORRECTED VERSION)
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Card from '../../components/ui/Card';
import Button from '../../components/forms/Button';
import Input from '../../components/forms/Input';
import { ArrowLeftIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';
import quotationService from '../../services/quotation.service';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';

const QuotationResponse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  
  const retailerId = user?.RetailerDetails?.retailer_id || user?.RetailerDetail?.retailer_id;
  
  const [quotation, setQuotation] = useState(null);
  const [priceFormData, setPriceFormData] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]); // ✅ NEW - Track selected items
  const [notes, setNotes] = useState('');
  const [existingResponse, setExistingResponse] = useState(null);

  const { 
    execute: fetchQuotation, 
    loading 
  } = useApi(
    () => quotationService.getQuotationById(id),
    false
  );

  const { 
    execute: submitResponse, 
    loading: submitting 
  } = useApi(
    (data) => quotationService.submitRetailerResponse(data),
    false
  );

  useEffect(() => {
    if (!retailerId) {
      toast.error('Retailer details not found. Please complete your profile.');
      navigate('/retailer/setup');
      return;
    }
  }, [user, retailerId, navigate]);

  useEffect(() => {
    if (!retailerId) return;
    
    if (id) {
      loadQuotationDetails();
    } else if (location.state?.quotation) {
      setQuotation(location.state.quotation);
      loadExistingResponse(location.state.quotation);
    }
  }, [id, location.state, retailerId]);

  const loadQuotationDetails = async () => {
    try {
      const response = await fetchQuotation();
      setQuotation(response);
      
      const myResponse = response.RetailerQuotations?.find(
        rq => rq.retailer_id === retailerId
      );
      
      if (myResponse) {
        setExistingResponse(myResponse);
        const existingItems = myResponse.RetailerQuotationItems?.map(item => ({
          quotation_item_id: item.quotation_item_id,
          unit_price: item.unit_price,
          quantity: item.quantity,
          notes: item.notes || ''
        })) || [];
        
        setPriceFormData(existingItems);
        // ✅ Mark existing items as selected
        setSelectedItems(existingItems.map(item => item.quotation_item_id));
        setNotes(myResponse.notes || '');
      } else {
        // Initialize form data for all items
        setPriceFormData(
          response.QuotationItems?.map(item => ({
            quotation_item_id: item.quotation_item_id,
            unit_price: '',
            quantity: item.requested_quantity,
            notes: ''
          })) || []
        );
        setSelectedItems([]); // ✅ Nothing selected by default
      }
    } catch (error) {
      console.error('Error fetching quotation details:', error);
      navigate('/retailer/quotations');
    }
  };

  const loadExistingResponse = (quotationData) => {
    const myResponse = quotationData.RetailerQuotations?.find(
      rq => rq.retailer_id === retailerId
    );
    
    if (myResponse) {
      setExistingResponse(myResponse);
      const existingItems = myResponse.RetailerQuotationItems?.map(item => ({
        quotation_item_id: item.quotation_item_id,
        unit_price: item.unit_price,
        quantity: item.quantity,
        notes: item.notes || ''
      })) || [];
      
      setPriceFormData(existingItems);
      setSelectedItems(existingItems.map(item => item.quotation_item_id));
      setNotes(myResponse.notes || '');
    }
  };

  // ✅ NEW - Toggle item selection
  const handleItemToggle = (quotationItemId) => {
    if (!canEdit) return;
    
    setSelectedItems(prev => {
      if (prev.includes(quotationItemId)) {
        // Deselect - remove from selected items
        return prev.filter(id => id !== quotationItemId);
      } else {
        // Select - add to selected items
        return [...prev, quotationItemId];
      }
    });
  };

  // ✅ NEW - Select all items
  const handleSelectAll = (e) => {
    if (!canEdit) return;
    
    if (e.target.checked) {
      const allItemIds = quotation.QuotationItems?.map(item => item.quotation_item_id) || [];
      setSelectedItems(allItemIds);
    } else {
      setSelectedItems([]);
    }
  };

  const handlePriceChange = (index, field, value) => {
    const newPriceFormData = [...priceFormData];
    newPriceFormData[index] = {
      ...newPriceFormData[index],
      [field]: value
    };
    setPriceFormData(newPriceFormData);
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();

    if (!retailerId) {
      toast.error('Retailer details not found. Please complete your profile.');
      navigate('/retailer/setup');
      return;
    }

    // ✅ Validate at least one item is selected
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to quote');
      return;
    }

    // ✅ Filter only selected items with valid prices
    const selectedItemsData = priceFormData.filter(item => 
      selectedItems.includes(item.quotation_item_id) &&
      item.unit_price && 
      parseFloat(item.unit_price) > 0
    );

    if (selectedItemsData.length === 0) {
      toast.error('Please enter valid prices for selected items');
      return;
    }

    if (selectedItemsData.length !== selectedItems.length) {
      toast.error('Please enter prices for all selected items');
      return;
    }

    if (new Date() > new Date(quotation.validity_until)) {
      toast.error('This quotation has expired');
      return;
    }

    try {
      await submitResponse({
        quotation_id: quotation.quotation_id,
        retailer_id: retailerId,
        items: selectedItemsData, // ✅ Only send selected items
        notes: notes || null
      });

      toast.success(existingResponse ? 'Response updated successfully' : 'Response submitted successfully');
      navigate('/retailer/quotations');
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  };

  const calculateTotal = () => {
    return priceFormData
      .filter(item => selectedItems.includes(item.quotation_item_id)) // ✅ Only calculate selected items
      .reduce((sum, item) => {
        return sum + (parseFloat(item.unit_price || 0) * parseFloat(item.quantity || 0));
      }, 0);
  };

  const isExpired = quotation && new Date() > new Date(quotation.validity_until);
  const canEdit = !isExpired && (!existingResponse || existingResponse.status !== 'submitted');

  if (!retailerId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-500 mb-4">Retailer Details Not Found</h2>
          <p className="text-gray-600 mb-4">Please complete your retailer profile to continue</p>
          <Button
            variant="primary"
            onClick={() => navigate('/retailer/setup')}
          >
            Complete Profile
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading quotation details...</div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Quotation not found</p>
        <Button onClick={() => navigate('/retailer/quotations')} className="mt-4">
          Back to Quotations
        </Button>
      </div>
    );
  }

  const allSelected = quotation.QuotationItems?.length > 0 && 
    selectedItems.length === quotation.QuotationItems.length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            onClick={() => navigate('/retailer/quotations')}
            className="flex items-center"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {existingResponse ? 'View Response' : 'Submit Response'}
            </h1>
            <p className="text-sm text-gray-600">
              Quotation: {quotation.quotation_number}
            </p>
          </div>
        </div>
        {existingResponse && (
          <div className="text-right">
            <p className="text-sm text-gray-600">Response Status</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {existingResponse.status}
            </span>
          </div>
        )}
      </div>

      {/* Quotation Info */}
      <Card>
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quotation Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Quotation Number</label>
              <p className="mt-1 text-gray-900 font-semibold">{quotation.quotation_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Quotation Name</label>
              <p className="mt-1 text-gray-900">{quotation.quotation_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Created On</label>
              <p className="mt-1 text-gray-900">
                {new Date(quotation.created_on).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Deadline</label>
              <p className={`mt-1 font-medium ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                {new Date(quotation.validity_until).toLocaleDateString()}
                {isExpired && ' (Expired)'}
              </p>
            </div>
          </div>
          {quotation.notes && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <p className="mt-1 text-gray-600">{quotation.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Response Form */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {existingResponse ? 'Your Response' : 'Submit Your Response'}
            </h2>
            {/* ✅ Selection Summary */}
            {canEdit && (
              <div className="text-sm text-gray-600">
                <span className="font-medium text-blue-600">
                  {selectedItems.length} of {quotation.QuotationItems?.length || 0} items selected
                </span>
              </div>
            )}
          </div>

          {/* ✅ Info Banner */}
          {canEdit && !existingResponse && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> You can quote for selected items only. 
                Check the items you want to quote and enter your prices.
              </p>
            </div>
          )}

          {isExpired && !existingResponse && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">
                <strong>This quotation has expired.</strong> You can no longer submit a response.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmitResponse}>
            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* ✅ Checkbox Column */}
                    {canEdit && (
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          title="Select/Deselect All"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Item
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Unit Price (₹)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Total (₹)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quotation.QuotationItems?.map((quotationItem, index) => {
                    const formItem = priceFormData[index] || {};
                    const isSelected = selectedItems.includes(quotationItem.quotation_item_id);
                    const total = parseFloat(formItem.unit_price || 0) * parseFloat(formItem.quantity || 0);
                    
                    return (
                      <tr 
                        key={quotationItem.quotation_item_id}
                        className={`${isSelected ? 'bg-blue-50' : ''} ${!canEdit && !isSelected ? 'opacity-50' : ''}`}
                      >
                        {/* ✅ Checkbox */}
                        {canEdit && (
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleItemToggle(quotationItem.quotation_item_id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{quotationItem.Item?.item_name}</p>
                            <p className="text-sm text-gray-500">{quotationItem.Item?.item_code}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-gray-900">
                            {parseFloat(quotationItem.requested_quantity).toFixed(2)} {quotationItem.unit_of_measure}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canEdit && isSelected ? (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={formItem.unit_price || ''}
                              onChange={(e) => handlePriceChange(index, 'unit_price', e.target.value)}
                              required={isSelected}
                              className="w-32 text-right"
                              placeholder="0.00"
                            />
                          ) : isSelected ? (
                            <span className="text-gray-900 font-medium">
                              ₹{parseFloat(formItem.unit_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">Not quoted</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isSelected ? (
                            <span className="font-medium text-gray-900">
                              ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {canEdit && isSelected ? (
                            <Input
                              type="text"
                              value={formItem.notes || ''}
                              onChange={(e) => handlePriceChange(index, 'notes', e.target.value)}
                              className="w-32"
                              placeholder="Optional"
                            />
                          ) : isSelected ? (
                            <span className="text-gray-600 text-sm">
                              {formItem.notes || '-'}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={canEdit ? "4" : "3"} className="px-4 py-3 text-right font-semibold text-gray-900">
                      Grand Total ({selectedItems.length} items):
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-lg text-green-600">
                      ₹{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Response Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Notes (Optional)
              </label>
              {canEdit ? (
                <textarea
                  className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes for your response..."
                />
              ) : (
                <div className="bg-gray-50 rounded-md p-3 text-gray-700">
                  {notes || 'No notes provided'}
                </div>
              )}
            </div>

            {/* Submit Button */}
            {canEdit && (
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/retailer/quotations')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || selectedItems.length === 0}
                  className="flex items-center"
                >
                  <CurrencyRupeeIcon className="h-5 w-5 mr-2" />
                  {submitting ? 'Submitting...' : existingResponse ? 'Update Response' : 'Submit Response'}
                </Button>
              </div>
            )}

            {existingResponse && existingResponse.submitted_on && (
              <div className="mt-4 text-sm text-gray-600">
                <p>Response submitted on: {new Date(existingResponse.submitted_on).toLocaleString()}</p>
                <p className="mt-1">Items quoted: {selectedItems.length} of {quotation.QuotationItems?.length}</p>
              </div>
            )}
          </form>
        </div>
      </Card>
    </div>
  );
};

export default QuotationResponse;