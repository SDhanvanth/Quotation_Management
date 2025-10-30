// pages/store/Reports.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  DocumentArrowDownIcon, 
  CalendarIcon,
  ChartBarIcon,
  CubeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/forms/Button';
import Input from '../../components/forms/Input';
import Select from '../../components/forms/Select';
import reportService from '../../services/report.service';
import toast from 'react-hot-toast';

const StoreReports = () => {
  const { user } = useSelector((state) => state.auth);
  const [reportType, setReportType] = useState('stock');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState(null);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    low_stock_only: false
  });

  const reportTypes = [
    { value: 'stock', label: 'Stock Report', icon: CubeIcon },
    { value: 'items', label: 'Items Report', icon: ChartBarIcon },
    { value: 'quotations', label: 'Quotations Report', icon: DocumentTextIcon }
  ];

  const quickDateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handleQuickDateRange = (range) => {
    const today = new Date();
    let startDate, endDate;

    switch (range) {
      case 'today':
        startDate = endDate = today.toISOString().split('T')[0];
        break;
      case 'week':
        startDate = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
        break;
      default:
        return;
    }

    setFilters({ ...filters, startDate, endDate });
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      let response;

      switch (reportType) {
        case 'stock':
          response = await reportService.getStockReport(filters);
          break;
        case 'items':
          response = await reportService.getItemReport(filters);
          break;
        case 'quotations':
          response = await reportService.getQuotationReport(filters);
          break;
        default:
          return;
      }

      setReportData(response);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      switch (reportType) {
        case 'stock':
          await reportService.exportStockReport(filters);
          break;
        case 'items':
          await reportService.exportItemReport(filters);
          break;
        case 'quotations':
          await reportService.exportQuotationReport(filters);
          break;
        default:
          return;
      }

      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Generate and export store reports</p>
      </div>

      {/* Report Configuration */}
      <Card>
        <div className="p-4 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Report Configuration</h2>
          
          {/* Report Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setReportType(type.value)}
                className={`p-4 border-2 rounded-lg flex items-center space-x-3 transition-all ${
                  reportType === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <type.icon className={`h-6 w-6 ${reportType === type.value ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`font-medium ${reportType === type.value ? 'text-blue-900' : 'text-gray-700'}`}>
                  {type.label}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Date Range
            </label>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {quickDateRanges.map((range) => (
                <Button
                  key={range.value}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickDateRange(range.value)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Start Date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <Input
              type="date"
              label="End Date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>

          {/* Report-Specific Filters */}
          {reportType === 'stock' && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="low_stock_only"
                checked={filters.low_stock_only}
                onChange={(e) => setFilters({ ...filters, low_stock_only: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="low_stock_only" className="text-sm font-medium text-gray-700">
                Show only low stock items
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button
              onClick={fetchReport}
              disabled={loading}
              className="flex items-center"
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={exporting || !reportData}
              className="flex items-center"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              {exporting ? 'Exporting...' : 'Export to Excel'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Summary */}
      {reportData && (
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Report Summary</h2>
              <span className="text-sm text-gray-600">
                Total Records: {reportData.count}
              </span>
            </div>

            {/* Stock Report Summary */}
            {reportType === 'stock' && reportData.data && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Items</p>
                  <p className="text-2xl font-bold text-blue-900">{reportData.data.length}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Low Stock</p>
                  <p className="text-2xl font-bold text-red-900">
                    {reportData.data.filter(s => s.current_stock <= s.minimum_stock && s.minimum_stock > 0).length}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Total Stock Value</p>
                  <p className="text-2xl font-bold text-green-900">
                                        ₹{reportData.data.reduce((sum, s) => sum + (s.current_stock * (s.Item?.price || 0)), 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-600 font-medium">Reserved Stock</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {reportData.data.reduce((sum, s) => sum + s.reserved_stock, 0)}
                  </p>
                </div>
              </div>
            )}

            {/* Items Report Summary */}
            {reportType === 'items' && reportData.data && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Items</p>
                  <p className="text-2xl font-bold text-blue-900">{reportData.data.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Active Items</p>
                  <p className="text-2xl font-bold text-green-900">
                    {reportData.data.filter(i => i.is_active).length}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Inactive Items</p>
                  <p className="text-2xl font-bold text-red-900">
                    {reportData.data.filter(i => !i.is_active).length}
                  </p>
                </div>
              </div>
            )}

            {/* Quotations Report Summary */}
            {reportType === 'quotations' && reportData.data && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Quotations</p>
                  <p className="text-2xl font-bold text-blue-900">{reportData.data.length}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-600 font-medium">Published</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {reportData.data.filter(q => q.QuotationStatus?.status_name === 'published').length}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Awarded</p>
                  <p className="text-2xl font-bold text-green-900">
                    {reportData.data.filter(q => q.QuotationStatus?.status_name === 'awarded').length}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium">Closed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reportData.data.filter(q => q.QuotationStatus?.status_name === 'closed').length}
                  </p>
                </div>
              </div>
            )}

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {reportType === 'stock' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reserved</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Available</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Min Stock</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      </>
                    )}
                    {reportType === 'items' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created On</th>
                      </>
                    )}
                    {reportType === 'quotations' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quotation No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Items</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Responses</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created On</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportType === 'stock' && reportData.data?.slice(0, 10).map((item, index) => {
                    const available = item.current_stock - item.reserved_stock;
                    const isLowStock = item.current_stock <= item.minimum_stock && item.minimum_stock > 0;
                    
                    return (
                      <tr key={index} className={isLowStock ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.Item?.item_code || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.Item?.item_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {item.current_stock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {item.reserved_stock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {available}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {item.minimum_stock || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {isLowStock ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {reportType === 'items' && reportData.data?.slice(0, 10).map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.item_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.item_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.Category?.category_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        ₹{item.price?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.unit_of_measure}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.created_on).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}

                  {reportType === 'quotations' && reportData.data?.slice(0, 10).map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.quotation_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.quotation_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {item.QuotationItems?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {item.RetailerQuotations?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.QuotationStatus?.status_name === 'published' ? 'bg-blue-100 text-blue-800' :
                          item.QuotationStatus?.status_name === 'awarded' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.QuotationStatus?.status_name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.created_on).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {reportData.data && reportData.data.length > 10 && (
              <div className="mt-4 text-center text-sm text-gray-600">
                Showing first 10 of {reportData.data.length} records. Export to Excel to view all data.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!reportData && !loading && (
        <Card>
          <div className="p-12 text-center">
            <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
            <p className="text-gray-600">
              Select a report type and date range, then click "Generate Report" to view data
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default StoreReports;