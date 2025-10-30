// components/admin/RetailerResponsesModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../forms/Button';
import { XMarkIcon } from '@heroicons/react/24/outline';
import quotationService from '../../services/quotation.service';
import toast from 'react-hot-toast';

const RetailerResponsesModal = ({ isOpen, onClose, quotation }) => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);

  useEffect(() => {
    if (isOpen && quotation) {
      fetchResponses();
    }
  }, [isOpen, quotation]);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const data = await quotationService.getRetailerResponses(quotation.quotation_id);
      console.log('Retailer responses:', data);
      setResponses(data.responses || data || []);
    } catch (error) {
      console.error('Error fetching responses:', error);
      toast.error('Failed to fetch retailer responses');
    } finally {
      setLoading(false);
    }
  };

  const getItemResponses = (itemId) => {
    const itemResponses = [];
    
    responses.forEach(response => {
      const retailerItem = response.RetailerQuotationItems?.find(
        ri => ri.QuotationItem?.item_id === itemId
      );
      
      if (retailerItem) {
        itemResponses.push({
          retailerName: response.RetailerDetails?.company_name || response.RetailerDetails?.User?.username || 'Unknown',
          unitPrice: retailerItem.unit_price,
          quantity: retailerItem.quantity,
          total: retailerItem.unit_price * retailerItem.quantity,
          notes: retailerItem.notes,
          submittedOn: response.submitted_on
        });
      }
    });
    
    return itemResponses.sort((a, b) => a.unitPrice - b.unitPrice);
  };

  if (!quotation) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Retailer Responses - ${quotation.quotation_number}`}
      size="large"
    >
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading responses...</div>
          </div>
        ) : responses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No retailer responses yet</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Responses:</span>
                  <span className="ml-2 font-semibold">{responses.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Items in Quotation:</span>
                  <span className="ml-2 font-semibold">{quotation.QuotationItems?.length || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2 font-semibold">{quotation.QuotationStatus?.status_name}</span>
                </div>
              </div>
            </div>

            {/* Item-wise Responses */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Item-wise Price Comparison</h3>
              
              {quotation.QuotationItems?.map((item) => {
                const itemResponses = getItemResponses(item.item_id);
                const isExpanded = selectedItemId === item.item_id;
                
                return (
                  <div key={item.quotation_item_id} className="border rounded-lg">
                    <button
                      onClick={() => setSelectedItemId(isExpanded ? null : item.item_id)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">
                          {item.Item?.item_name} ({item.Item?.item_code})
                        </p>
                        <p className="text-sm text-gray-600">
                          Requested: {item.requested_quantity} {item.unit_of_measure} • 
                          Responses: {itemResponses.length}
                        </p>
                      </div>
                      {itemResponses.length > 0 && (
                        <div className="text-right mr-4">
                          <p className="text-sm text-gray-600">Price Range</p>
                          <p className="font-semibold text-green-600">
                            ₹{Math.min(...itemResponses.map(r => r.unitPrice))} - 
                            ₹{Math.max(...itemResponses.map(r => r.unitPrice))}
                          </p>
                        </div>
                      )}
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isExpanded && (
                      <div className="border-t">
                        {itemResponses.length === 0 ? (
                          <p className="p-4 text-gray-500 text-center">No responses for this item</p>
                        ) : (
                          <table className="min-w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Retailer</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {itemResponses.map((response, idx) => (
                                <tr key={idx} className={idx === 0 ? 'bg-green-50' : ''}>
                                  <td className="px-4 py-2 text-sm text-gray-900">
                                    {response.retailerName}
                                    {idx === 0 && <span className="ml-2 text-xs text-green-600 font-medium">(Lowest)</span>}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-right font-medium">
                                    ₹{response.unitPrice.toLocaleString('en-IN')}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-right">
                                    {response.quantity}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-right font-medium">
                                    ₹{response.total.toLocaleString('en-IN')}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-600">
                                    {response.notes || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Overall Summary */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Retailer Summary</h3>
              <div className="space-y-2">
                {responses.map((response, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{response.RetailerDetails?.company_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">
                        Submitted: {new Date(response.submitted_on).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-semibold text-lg">₹{response.total_amount?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RetailerResponsesModal;