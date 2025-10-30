// components/admin/QuotationRetailerResponses.jsx (New component)
import { useEffect, useState } from 'react'
import api from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import Card from '../ui/Card'

const QuotationRetailerResponses = ({ quotationId }) => {
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchResponses()
  }, [quotationId])

  const fetchResponses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const res = await api.get(`/quotations/${quotationId}/responses`)
      setResponses(res.data?.responses || [])
    } catch (err) {
      console.error('Error fetching responses:', err)
      setError('Failed to load retailer responses')
      setResponses([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner size="sm" />
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
        {error}
      </div>
    )
  }

  if (responses.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded text-gray-600 text-sm">
        No retailer responses yet
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {responses.map((response) => (
        <Card key={response.retailer_quotation_id} className="border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-lg text-gray-800">
                {response.RetailerDetails?.retailer_name || 'Unknown Retailer'}
              </h3>
              <p className="text-sm text-gray-600">
                {response.RetailerDetails?.owner_name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Email: {response.RetailerDetails?.email_primary}
              </p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                response.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {response.status}
              </span>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(response.submitted_on).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Item Code</th>
                  <th className="px-4 py-2 text-left">Item Name</th>
                  <th className="px-4 py-2 text-center">Qty Requested</th>
                  <th className="px-4 py-2 text-center">Qty Quoted</th>
                  <th className="px-4 py-2 text-right">Unit Price</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {response.RetailerQuotationItems?.map((item) => (
                  <tr key={item.retailer_quotation_item_id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{item.Item?.item_code || 'N/A'}</td>
                    <td className="px-4 py-2">{item.Item?.item_name || 'N/A'}</td>
                    <td className="px-4 py-2 text-center">{item.Item?.requested_quantity || 0}</td>
                    <td className="px-4 py-2 text-center">{item.quantity}</td>
                    <td className="px-4 py-2 text-right">₹{parseFloat(item.unit_price).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">₹{parseFloat(item.total_amount || 0).toFixed(2)}</td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan="6" className="px-4 py-2 text-center text-gray-500">
                      No items quoted
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 font-semibold">
                <tr>
                  <td colSpan="5" className="px-4 py-2 text-right">Total Amount:</td>
                  <td className="px-4 py-2 text-right">₹{parseFloat(response.total_amount || 0).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {response.notes && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
              <strong>Notes:</strong> {response.notes}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

export default QuotationRetailerResponses